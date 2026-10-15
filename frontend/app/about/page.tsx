import type { Metadata } from "next";
import { BackLink, Card, PageTitle } from "@/components/ui";

export const metadata: Metadata = {
  title: "About · Study with AI",
  description: "What Study with AI does and how to get the best results.",
};

export default function AboutPage() {
  return (
    <>
      <BackLink />
      <PageTitle title="About" />
      <Card>
        <p className="text-pretty">
          Study with AI turns a photo of your notes into study material. You
          upload a picture of handwritten or printed notes, like a notebook
          page, a textbook page or a whiteboard, and Google&apos;s Gemini 2.5
          Flash reads it for you.
        </p>
        <ul className="mt-5 space-y-3">
          <li>
            <span className="font-semibold">Key concepts:</span> a short
            summary of the main ideas. It only uses what&apos;s actually in
            your photo.
          </li>
          <li>
            <span className="font-semibold">Quizzes:</span> 3–7
            multiple-choice questions built from those concepts. You can check
            your answers right away.
          </li>
        </ul>
        <p className="mt-6 text-sm text-muted italic">
          Tip: clear, well-lit photos work best. AI can make mistakes, so
          compare the summary with your own notes.
        </p>
      </Card>
    </>
  );
}
