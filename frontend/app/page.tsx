"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Card, PageTitle, primaryButton, secondaryButton } from "@/components/ui";
import { photoUrl, uploadPhoto } from "@/lib/api";
import { setSession, useSession } from "@/lib/session";

const ACCEPTED = /\.(jpe?g|png)$/i;

export default function HomePage() {
  const session = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file || uploading) return;
    if (!ACCEPTED.test(file.name)) {
      setError("Please choose a JPG or PNG image.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      await uploadPhoto(file);
      setSession({ photoVersion: Date.now(), concepts: null, quizzes: null });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <PageTitle
        title="Study with AI"
        subtitle="Upload a photo of your notes and get key concepts and quizzes to help you remember what you have learned."
      />

      {session === null ? null : session.photoVersion === null ? (
        <div className="rise">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFile(e.dataTransfer.files[0]);
            }}
            disabled={uploading}
            className={`flex w-full cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait ${
              dragging
                ? "border-accent bg-accent-soft"
                : "border-line bg-card hover:border-accent"
            }`}
          >
            <span
              aria-hidden
              className="grid size-14 place-items-center rounded-full bg-accent-soft text-2xl text-accent"
            >
              {uploading ? (
                <span className="size-6 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
              ) : (
                "↑"
              )}
            </span>
            <span className="text-lg font-semibold">
              {uploading ? "Uploading…" : "Choose an image"}
            </span>
            <span className="text-sm text-muted">
              Drag and drop it here, or click to browse · JPG, JPEG or PNG
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {error && (
            <p role="alert" className="mt-4 text-sm font-medium text-bad">
              {error}
            </p>
          )}
        </div>
      ) : (
        <Card>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl(session.photoVersion)}
            alt="Your uploaded notes"
            className="max-h-[28rem] w-full rounded-xl border border-line bg-paper object-contain"
          />
          <p className="mt-6 text-sm font-medium text-muted">
            Choose one of the following options
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Link href="/key-concepts" className={primaryButton}>
              Key concepts
            </Link>
            <Link href="/quizzes" className={primaryButton}>
              Quizzes
            </Link>
          </div>
          <button
            type="button"
            onClick={() =>
              setSession({ photoVersion: null, concepts: null, quizzes: null })
            }
            className={`${secondaryButton} mt-3 w-full`}
          >
            Choose another photo
          </button>
        </Card>
      )}
    </>
  );
}
