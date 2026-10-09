"use client";

import { useSyncExternalStore } from "react";
import { fetchKeyConcepts, fetchQuizzes, type Quiz } from "./api";

// Replaces Streamlit's st.session_state: lives for the browser tab, so the
// key concepts are generated once and reused for the quiz.
export type Session = {
  photoVersion: number | null;
  concepts: string | null;
  quizzes: Quiz[] | null;
};

const STORAGE_KEY = "notes-with-ai-session";
const EMPTY: Session = { photoVersion: null, concepts: null, quizzes: null };

let session: Session | undefined;
const listeners = new Set<() => void>();

function getSnapshot(): Session {
  if (session === undefined) {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      session = stored ? { ...EMPTY, ...JSON.parse(stored) } : EMPTY;
    } catch {
      session = EMPTY;
    }
  }
  return session as Session;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// In-flight requests are shared so a re-mounted page never asks Gemini twice.
let conceptsRequest: Promise<void> | null = null;
let quizzesRequest: Promise<void> | null = null;

export function setSession(patch: Partial<Session>) {
  const previous = getSnapshot();
  if ("photoVersion" in patch && patch.photoVersion !== previous.photoVersion) {
    // A different photo: anything still in flight belongs to the old one, so
    // the next page must start its own request instead of reusing it.
    conceptsRequest = null;
    quizzesRequest = null;
  }
  session = { ...previous, ...patch };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {}
  listeners.forEach((listener) => listener());
}

/** Returns null until the page has hydrated in the browser. */
export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

export function loadConcepts() {
  if (conceptsRequest) return conceptsRequest;
  // The photo this request is for; a result for any other photo is dropped.
  const { photoVersion } = getSnapshot();
  const request: Promise<void> = fetchKeyConcepts()
    .then((concepts) => {
      if (getSnapshot().photoVersion !== photoVersion) return;
      if (!concepts?.trim()) {
        throw new Error("Gemini couldn't read anything from this image");
      }
      setSession({ concepts });
    })
    .finally(() => {
      // Only clear our own slot: a newer request may already live there.
      if (conceptsRequest === request) conceptsRequest = null;
    });
  conceptsRequest = request;
  return request;
}

export function loadQuizzes() {
  if (quizzesRequest) return quizzesRequest;
  const { photoVersion, concepts: knownConcepts } = getSnapshot();
  const request: Promise<void> = fetchQuizzes(knownConcepts)
    .then(({ concepts, quizzes }) => {
      if (getSnapshot().photoVersion !== photoVersion) return;
      setSession({ concepts });
      if (!quizzes) {
        throw new Error("Couldn't generate the quiz this time. Please try again.");
      }
      setSession({ quizzes });
    })
    .finally(() => {
      if (quizzesRequest === request) quizzesRequest = null;
    });
  quizzesRequest = request;
  return request;
}
