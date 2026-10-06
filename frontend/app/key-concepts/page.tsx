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
} from "@/components/ui";
import { loadConcepts, useSession } from "@/lib/session";

export default function KeyConceptsPage() {
  const session = useSession();
  const [error, setError] = useState<string | null>(null);

  const hasPhoto = session != null && session.photoVersion !== null;
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
          <Link href="/quizzes" className={`${primaryButton} mt-7`}>
            Take the quiz <span aria-hidden>→</span>
          </Link>
        </Card>
      ) : error !== null ? (
        <ErrorCard message={error} onRetry={() => setError(null)} />
      ) : (
        <Loading label="Getting key concepts…" />
      )}
    </>
  );
}
