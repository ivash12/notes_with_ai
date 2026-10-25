"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BackLink,
  Card,
  ErrorCard,
  Loading,
  NoPhoto,
  PageTitle,
  primaryButton,
  secondaryButton,
} from "@/components/ui";
import { loadConcepts, useSession } from "@/lib/session";

function downloadText(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function CopyButton({ text }: { text: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (status === "idle") return;
    const timer = setTimeout(() => setStatus("idle"), 2000);
    return () => clearTimeout(timer);
  }, [status]);

  return (
    <button
      type="button"
      onClick={() =>
        // The clipboard API is missing outside secure contexts (plain http on a
        // non-localhost host), so a failure must not look like a success.
        Promise.resolve()
          .then(() => navigator.clipboard.writeText(text))
          .then(
            () => setStatus("copied"),
            () => setStatus("failed"),
          )
      }
      className={`${secondaryButton} min-w-36`}
    >
      <span aria-live="polite">
        {status === "copied" ? "Copied ✓" : status === "failed" ? "Couldn't copy" : "Copy"}
      </span>
    </button>
  );
}

export default function KeyConceptsPage() {
  const session = useSession();
  const [error, setError] = useState<string | null>(null);

  const hasPhoto = session != null && session.photoId !== null;
  const concepts = session?.concepts ?? null;

  useEffect(() => {
    if (!hasPhoto || concepts !== null || error !== null) return;
    loadConcepts().catch((e: Error) => setError(e.message));
  }, [hasPhoto, concepts, error]);

  return (
    <>
      <BackLink />
      <PageTitle title="Key concepts" />
      {session === null ? null : !hasPhoto ? (
        <NoPhoto />
      ) : concepts !== null ? (
        <Card>
          <p className="text-lg leading-relaxed whitespace-pre-line">{concepts}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/quizzes" className={primaryButton}>
              Take the quiz <span aria-hidden>→</span>
            </Link>
            <CopyButton text={concepts} />
            <button
              type="button"
              onClick={() => downloadText(concepts, "key-concepts.txt")}
              className={secondaryButton}
            >
              Download .txt
            </button>
          </div>
        </Card>
      ) : error !== null ? (
        <ErrorCard message={error} onRetry={() => setError(null)} />
      ) : (
        <Loading label="Getting key concepts…" />
      )}
    </>
  );
}
