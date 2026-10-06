"use client";

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
import type { Quiz } from "@/lib/api";
import { loadQuizzes, useSession } from "@/lib/session";

export default function QuizzesPage() {
  const session = useSession();
  const [error, setError] = useState<string | null>(null);

  const hasPhoto = session != null && session.photoVersion !== null;
  const quizzes = session?.quizzes ?? null;

  useEffect(() => {
    if (!hasPhoto || quizzes !== null || error !== null) return;
    loadQuizzes().catch((e: Error) => setError(e.message));
  }, [hasPhoto, quizzes, error]);

  return (
    <>
      <BackLink />
      <PageTitle title="Quizzes" subtitle="Answer all quizzes and get the feedback" />
      {session === null ? null : !hasPhoto ? (
        <NoPhoto />
      ) : quizzes !== null ? (
        <QuizForm quizzes={quizzes} />
      ) : error !== null ? (
        <ErrorCard message={error} onRetry={() => setError(null)} />
      ) : (
        <Loading label="Getting the quizzes…" />
      )}
    </>
  );
}

function QuizForm({ quizzes }: { quizzes: Quiz[] }) {
  const [answers, setAnswers] = useState<(string | null)[]>(() =>
    quizzes.map(() => null),
  );
  const [checked, setChecked] = useState(false);

  const score = quizzes.filter((quiz, i) => answers[i] === quiz.correct).length;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setChecked(true);
      }}
    >
      {checked && (
        <Card className="flex items-center justify-between gap-4">
          <div>
            <p className="font-serif text-2xl font-semibold">
              {score} of {quizzes.length} correct
            </p>
            <p className="mt-1 text-sm text-muted">
              {score === quizzes.length
                ? "Perfect — you know these notes."
                : "Review the answers below and try again."}
            </p>
          </div>
          <div
            aria-hidden
            className="h-2 w-28 shrink-0 overflow-hidden rounded-full bg-line"
          >
            <div
              className="h-full rounded-full bg-good transition-all"
              style={{ width: `${(score / quizzes.length) * 100}%` }}
            />
          </div>
        </Card>
      )}

      {quizzes.map((quiz, i) => {
        const answer = answers[i];
        const isCorrect = answer === quiz.correct;
        return (
          <Card key={i}>
            <fieldset disabled={checked}>
              <legend className="flex gap-3 text-lg font-semibold">
                <span className="text-accent">{i + 1}.</span>
                {quiz.question}
              </legend>
              <div className="mt-4 space-y-2">
                {quiz.options.map((option, j) => {
                  const selected = answer === option;
                  const tone = !checked
                    ? selected
                      ? "border-accent bg-accent-soft"
                      : "border-line hover:border-accent"
                    : option === quiz.correct
                      ? "border-good bg-good-soft"
                      : selected
                        ? "border-bad bg-bad-soft"
                        : "border-line opacity-60";
                  return (
                    <label
                      key={j}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${tone} ${
                        checked ? "" : "cursor-pointer"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${i}`}
                        checked={selected}
                        onChange={() =>
                          setAnswers((prev) =>
                            prev.map((a, k) => (k === i ? option : a)),
                          )
                        }
                        className="size-4 accent-(--accent)"
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            {checked && (
              <p
                className={`mt-4 text-sm font-medium ${isCorrect ? "text-good" : "text-bad"}`}
              >
                {isCorrect
                  ? `✓ Your answer '${answer}' is correct!`
                  : answer === null
                    ? `✗ You didn't answer. Correct answer is '${quiz.correct}'`
                    : `✗ Your answer '${answer}' is incorrect. Correct answer is '${quiz.correct}'`}
              </p>
            )}
          </Card>
        );
      })}

      {checked ? (
        <button
          type="button"
          onClick={() => {
            setAnswers(quizzes.map(() => null));
            setChecked(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`${secondaryButton} w-full`}
        >
          Try again
        </button>
      ) : (
        <button type="submit" className={`${primaryButton} w-full`}>
          Check my answers
        </button>
      )}
    </form>
  );
}
