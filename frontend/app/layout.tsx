import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";
import Link from "next/link";
import { ThemeToggle, themeScript } from "@/components/theme-toggle";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-serif-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Study with AI",
  description:
    "Upload a photo of your notes and get key concepts and a quiz to remember what you have learned.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 pt-6 sm:pt-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-serif text-lg font-semibold tracking-tight"
          >
            <span
              aria-hidden
              className="grid size-7 place-items-center rounded-lg bg-accent text-sm text-on-accent"
            >
              ✎
            </span>
            Study with AI
          </Link>
          <ThemeToggle />
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-8 pb-16 sm:pt-12">
          {children}
        </main>
        <footer className="pb-6 text-center text-xs text-muted">
          Powered by Gemini 2.5 Flash
        </footer>
      </body>
    </html>
  );
}
