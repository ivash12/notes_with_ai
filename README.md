# Notes with AI

A Next.js + FastAPI app that turns a photo of your study notes into a concise summary of key concepts and an auto-generated quiz — powered by Gemini 2.5 Flash's vision capabilities.

## What it does

1. **Upload a photo** of your handwritten or printed notes — a whiteboard, a textbook page, a notebook spread, anything readable.
2. **Get key concepts** — Gemini extracts the core ideas from the image and condenses them into a short summary, written to stay strictly grounded in what's actually on the page.
3. **Take a quiz** — based on those extracted concepts, the app generates a short multiple-choice quiz (3–7 questions, scaled to how much content is in your notes), lets you answer each question, and checks your results against the correct answers.

## How it works

First, you upload a photo of your notes on the Next.js front end, which sends it to a small FastAPI server. The server saves each upload as its own file in an `uploads/` folder and answers with a random `photo_id`; the front end sends that id back with every later request, so several tabs or users never overwrite each other's photo. Then you choose whether you want to see key concepts from your notes or take a quiz. Once you pick an option, the app navigates you to that page, where Gemini generates either the key concepts or a JSON-structured quiz based on those concepts, which gets shown to you as radio buttons — you can then check your answers by clicking a button.

The front end keeps the `photo_id` and the results in the browser tab's `sessionStorage` to save time and API tokens, since it only generates the key concepts once and then reuses them to generate the quizzes. If the server no longer has the photo for a stored id, the tab goes back to the upload screen.

Uploaded photos stay in `uploads/` until you delete them — nothing cleans the folder up automatically.

## Why I built it

I wanted to test how good Gemini's vision model actually is at turning messy, real handwriting into something genuinely useful for studying — not just OCR, but a real synthesis step. The harder part turned out to be prompt design: getting consistent paragraph length, stopping the model from echoing the instructions back as part of its answer, and deciding where it's safe to let the model use general knowledge (for writing plausible quiz distractors) versus where it has to stay strictly grounded in the source material (to avoid hallucinating facts that aren't in the notes).

## Tech stack

- **Next.js (App Router) + Tailwind CSS** — the user interface (upload, key concepts and quiz pages)
- **FastAPI** — thin HTTP layer in `server.py` that exposes the Gemini functions to the front end
- **Google Gen AI SDK (`google-genai`)** — `gemini-2.5-flash` for both vision (image → text) and text-only (concepts → quiz JSON) calls
- **Python's `json` module** — structured output parsing for the quiz generator

## Running it locally

```bash
git clone https://github.com/ivash12/notes_with_ai.git
cd notes_with_ai
pip install -r requirements.txt
cd frontend
npm install
```

Create a `.env` file in the project root with your own Gemini API key (get one free at [aistudio.google.com](https://aistudio.google.com)):

```
GEMINI_API_KEY=your_key_here
```

Then start the backend from the project root:

```bash
uvicorn server:app --port 8000
```

And, in a second terminal, the front end:

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If the backend runs somewhere else, set `NEXT_PUBLIC_API_URL` in `frontend/.env.local`.

## Project structure

```
notes_with_ai/
├── gemini_functions.py      # All Gemini API calls (vision + text)
├── server.py                # FastAPI endpoints wrapping the Gemini functions
├── requirements.txt
├── uploads/                 # Uploaded photos, one file per photo_id (git-ignored, created on first run)
└── frontend/                # Next.js app
    ├── app/
    │   ├── page.tsx              # Upload page — handles the photo, navigation
    │   ├── key-concepts/page.tsx # Displays the extracted key concepts
    │   └── quizzes/page.tsx      # Renders the quiz, checks answers
    ├── components/ui.tsx         # Shared UI pieces
    └── lib/                      # API client and per-tab session state
```


## Notes on API usage

This runs on Gemini's free tier (`gemini-2.5-flash`), which is sufficient for personal use — no billing required.

## Author 

https://github.com/ivash12