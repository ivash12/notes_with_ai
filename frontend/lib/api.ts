export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export type Quiz = {
  question: string;
  options: string[];
  correct: string;
};

/** A response the backend answered with an error status. */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new Error(
      `Can't reach the backend at ${API_URL}. Is the Python server running?`,
    );
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      typeof body?.detail === "string"
        ? body.detail
        : `Request failed (${response.status})`,
      response.status,
    );
  }
  return body as T;
}

function postJson<T>(path: string, body: unknown) {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function photoUrl(photoId: string) {
  return `${API_URL}/api/photo/${photoId}`;
}

/** False only when the backend says the photo is gone, not when it's unreachable. */
export async function photoExists(photoId: string) {
  try {
    const response = await fetch(photoUrl(photoId));
    return response.status !== 404;
  } catch {
    return true;
  }
}

export async function uploadPhoto(file: File) {
  const form = new FormData();
  form.append("file", file);
  const data = await request<{ photo_id: string }>("/api/photo", {
    method: "POST",
    body: form,
  });
  return data.photo_id;
}

export async function fetchKeyConcepts(photoId: string) {
  const data = await postJson<{ concepts: string }>("/api/key-concepts", {
    photo_id: photoId,
  });
  return data.concepts;
}

export function fetchQuizzes(photoId: string, concepts: string | null) {
  return postJson<{ concepts: string; quizzes: Quiz[] | null }>("/api/quizzes", {
    photo_id: photoId,
    concepts,
  });
}
