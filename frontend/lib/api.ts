export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export type Quiz = {
  question: string;
  options: string[];
  correct: string;
};

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
    throw new Error(
      typeof body?.detail === "string"
        ? body.detail
        : `Request failed (${response.status})`,
    );
  }
  return body as T;
}

export function photoUrl(version: number) {
  return `${API_URL}/api/photo?v=${version}`;
}

export async function uploadPhoto(file: File) {
  const form = new FormData();
  form.append("file", file);
  await request("/api/photo", { method: "POST", body: form });
}

export async function fetchKeyConcepts() {
  const data = await request<{ concepts: string }>("/api/key-concepts", {
    method: "POST",
  });
  return data.concepts;
}

export function fetchQuizzes(concepts: string | null) {
  return request<{ concepts: string; quizzes: Quiz[] | null }>("/api/quizzes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ concepts }),
  });
}
