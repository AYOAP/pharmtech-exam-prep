# PTCB Passport

PTCB Passport is a single-user, production-oriented PTCE study app built with Next.js, Tailwind CSS, local storage, and an optional OpenAI tutor. It is designed around the current **January 2026 PTCE content outline** and helps one learner study consistently for a July target exam date.

## What the app includes

- First-time onboarding and tutorial
- Full-length 90-question diagnostic exam with current domain weighting
- Personalized daily study plan tied to time until July
- Pink, gamified dashboard with streak, XP, readiness, and domain levels
- Adaptive quiz engine with explanations for correct and incorrect choices
- Spaced-repetition flashcards for top drugs, schedules, and sig codes
- Drug mastery search and class-based memory hooks
- Timed mock exams
- Weakness engine that tracks misses and re-serves weak topics
- Progress dashboard with readiness, study time, and pass-probability estimate
- Optional AI tutor powered by the OpenAI Responses API

## PTCE alignment

The app is aligned to the current PTCB exam structure:

- 90 multiple-choice questions
- 80 scored and 10 unscored questions
- 1 hour 50 minutes of testing time, plus short tutorial and survey time
- Current content-outline weights effective January 2026:
  - Medications: 35%
  - Federal Requirements: 18.75%
  - Patient Safety and Quality Assurance: 23.75%
  - Order Entry and Processing: 22.5%

Official references used while building:

- [PTCB CPhT credential page](https://www.ptcb.org/credentials/certified-pharmacy-technician)
- [PTCE content outline effective January 2026](https://myaccount.ptcb.org/lib24watch/files/download/1489)
- [PTCB guidebook page for the CPhT program](https://www.ptcb.org/guidebook)

## Tech stack

- Next.js App Router
- React
- Tailwind CSS
- Browser local storage for persistence
- Optional Vercel serverless route for the AI tutor

## Requirements

- Node.js 20.9 or newer
- npm 10 or newer recommended

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Start the dev server:

```bash
npm run dev
```

3. Open the local URL, usually:

```text
http://localhost:3000
```

## Optional AI tutor setup

The app works without the tutor. To enable it, create `.env.local`:

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5-mini
```

Notes:

- The tutor route uses the OpenAI Responses API.
- `gpt-5-mini` is the default because it is fast and cost-efficient for short study explanations.
- You can swap models later with `OPENAI_MODEL`.

OpenAI references used for the tutor setup:

- [Responses API migration guide](https://platform.openai.com/docs/guides/responses-vs-chat-completions)
- [GPT-5 mini model page](https://platform.openai.com/docs/models/gpt-5-mini)

## Active file structure

```text
.
├── app
│   ├── api
│   │   └── tutor
│   │       └── route.js
│   ├── globals.css
│   ├── layout.jsx
│   └── page.jsx
├── components
│   ├── PtcbStudyApp.jsx
│   └── ui.js
├── content
│   ├── blueprint.js
│   ├── drugBank.js
│   └── sigCodes.js
├── lib
│   ├── questionFactory.js
│   ├── storage.js
│   └── studyEngine.js
├── jsconfig.json
├── next.config.mjs
├── package.json
├── postcss.config.js
├── README.md
└── tailwind.config.js
```

## How the app persists data

The app stores everything locally in the browser:

- onboarding completion
- streak and XP
- diagnostic, quiz, and mock-exam history
- mastery by domain
- weak-topic tracking
- flashcard spaced-repetition state
- daily-plan task completion
- active in-progress study session

No database is required.

## Deployment on Vercel

1. Push this project to GitHub.
2. In Vercel, click **Add New Project**.
3. Import the repo.
4. Set the framework to **Next.js** if Vercel does not auto-detect it.
5. Add environment variables if you want the tutor:
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL` (optional)
6. Deploy.

Vercel will generate a URL like:

```text
https://your-project-name.vercel.app
```

## How to share the app

After deployment, share the Vercel production URL with the learner. Because the app uses browser local storage:

- each browser/device keeps its own progress
- sharing the link shares the app, not the saved progress
- if the same learner wants the same progress everywhere, they need to keep using the same device/browser or a future sync layer would need to be added

## Where to edit content later

If you want to expand or tune the study experience, edit these files:

- `content/blueprint.js`
  - exam weights
  - onboarding copy
  - learning path
  - study strategy text
- `content/drugBank.js`
  - top-drug list
  - class mnemonics
  - controlled schedule lookup
- `content/sigCodes.js`
  - sig-code flashcards and question content
- `lib/questionFactory.js`
  - quiz bank generation
  - federal-law items
  - patient-safety items
  - order-entry math and sig-code questions
- `lib/studyEngine.js`
  - daily-plan logic
  - readiness and pass-probability scoring
  - flashcard spacing behavior
  - session generation and grading
- `components/PtcbStudyApp.jsx`
  - page flow
  - dashboard layout
  - session runner
  - flashcard UX
  - progress views
- `app/api/tutor/route.js`
  - tutor prompt
  - OpenAI model choice
  - response handling

## Notes on the current build environment

This project targets modern Next.js on Node 20.9+. If your local machine is older, upgrade Node before running `npm run dev` or deploying from that machine.
