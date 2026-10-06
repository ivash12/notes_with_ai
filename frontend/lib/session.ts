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

export function setSession(patch: Partial<Session>) {
  session = { ...getSnapshot(), ...patch };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {}
  listeners.forEach((listener) => listener());
}

/** Returns null until the page has hydrated in the browser. */
export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

// In-flight requests are shared so a re-mounted page never asks Gemini twice.
let conceptsRequest: Promise<void> | null = null;
let quizzesRequest: Promise<void> | null = null;

export function loadConcepts() {
  conceptsRequest ??= fetchKeyConcepts()
    .then((concepts) => setSession({ concepts }))
    .finally(() => {
      conceptsRequest = null;
    });
  return conceptsRequest;
}

export function loadQuizzes() {
  quizzesRequest ??= fetchQuizzes(getSnapshot().concepts)
    .then(({ concepts, quizzes }) => {
      setSession({ concepts });
      if (!quizzes) {
        throw new Error("Couldn't generate the quiz this time. Please try again.");
      }
      setSession({ quizzes });
    })
    .finally(() => {
      quizzesRequest = null;
    });
  return quizzesRequest;
}
