"use client";

import { useSyncExternalStore } from "react";
import {
  ApiError,
  fetchKeyConcepts,
  fetchQuizzes,
  photoExists,
  type Quiz,
} from "./api";

// Replaces Streamlit's st.session_state: lives for the browser tab, so the
// key concepts are generated once and reused for the quiz.
export type Session = {
  photoId: string | null;
  concepts: string | null;
  quizzes: Quiz[] | null;
};

const STORAGE_KEY = "notes-with-ai-session-v2";
const EMPTY: Session = { photoId: null, concepts: null, quizzes: null };

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
  if ("photoId" in patch && patch.photoId !== previous.photoId) {
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

// The backend no longer has this photo: go back to the upload screen, unless
// the tab has already moved on to another photo.
function forgetPhoto(photoId: string) {
  if (getSnapshot().photoId === photoId) setSession(EMPTY);
}

function forgetPhotoOn404(photoId: string) {
  return (e: unknown) => {
    if (e instanceof ApiError && e.status === 404) forgetPhoto(photoId);
    throw e;
  };
}

/** For when the photo fails to load: only a real 404 resets the session. */
export async function forgetPhotoIfMissing(photoId: string) {
  if (!(await photoExists(photoId))) forgetPhoto(photoId);
}

const NO_PHOTO = "Upload a photo of your notes first";

export function loadConcepts() {
  if (conceptsRequest) return conceptsRequest;
  // The photo this request is for; a result for any other photo is dropped.
  const { photoId } = getSnapshot();
  if (photoId === null) return Promise.reject(new Error(NO_PHOTO));
  const request: Promise<void> = fetchKeyConcepts(photoId)
    .then((concepts) => {
      if (getSnapshot().photoId !== photoId) return;
      if (!concepts?.trim()) {
        throw new Error("Gemini couldn't read anything from this image");
      }
      setSession({ concepts });
    })
    .catch(forgetPhotoOn404(photoId))
    .finally(() => {
      // Only clear our own slot: a newer request may already live there.
      if (conceptsRequest === request) conceptsRequest = null;
    });
  conceptsRequest = request;
  return request;
}

export function loadQuizzes() {
  if (quizzesRequest) return quizzesRequest;
  const { photoId, concepts: knownConcepts } = getSnapshot();
  if (photoId === null) return Promise.reject(new Error(NO_PHOTO));
  const request: Promise<void> = fetchQuizzes(photoId, knownConcepts)
    .then(({ concepts, quizzes }) => {
      if (getSnapshot().photoId !== photoId) return;
      setSession({ concepts });
      if (!quizzes) {
        throw new Error("Couldn't generate the quiz this time. Please try again.");
      }
      setSession({ quizzes });
    })
    .catch(forgetPhotoOn404(photoId))
    .finally(() => {
      if (quizzesRequest === request) quizzesRequest = null;
    });
  quizzesRequest = request;
  return request;
}
