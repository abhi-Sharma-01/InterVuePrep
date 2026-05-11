# InterVue Prep

InterVue Prep is an AI-powered interview preparation platform built with React, Vite, Firebase, Gemini, and Vapi. It combines mock interview practice, interview feedback, resume analysis, job-prep utilities, career tools, and a candidate dashboard into a single frontend application.

The project is designed to help candidates practice interviews more realistically and prepare across multiple areas such as communication, coding, resume quality, company research, job search, and study planning.

## Table of Contents

- [Project Overview](#project-overview)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Application Flow](#application-flow)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Firebase Usage](#firebase-usage)
- [AI Integrations](#ai-integrations)
- [Key Screens and Modules](#key-screens-and-modules)
- [Known Limitations and Gaps](#known-limitations-and-gaps)
- [Deployment Notes](#deployment-notes)
- [Architecture Assets](#architecture-assets)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)
- [Contact](#contact)

## Project Overview

The application provides a complete interview-preparation workspace with:

- a landing page for product discovery
- Firebase-based authentication
- a dashboard for user activity and past interview sessions
- AI-generated interview questions
- a voice-based mock interview experience
- AI-generated interview feedback and scoring
- resume analysis with PDF parsing
- cover letter generation
- career roadmap generation
- company research assistance
- interview Q&A generation
- job search support
- study material browsing
- expert discovery via WhatsApp
- a coding playground for practice problems

This repository currently contains the frontend application and Firebase integration logic. Some features depend on third-party APIs or backend services that are not included in this repo.

## Core Features

### 1. AI mock interview flow

- Users fill in an interview preparation form with name, target role, skills, experience, and interview types.
- Gemini generates interview questions in structured JSON format.
- Questions are saved to Firestore in the `interview_submissions` collection.
- The app launches a live voice interview using Vapi.
- The assistant asks one question at a time and captures user responses.
- At the end of the interview, Gemini evaluates the transcript and returns structured feedback:
  - strengths
  - improvement areas
  - communication clarity score
  - relevance score
  - overall score
  - detailed summary
- Final feedback is written back to Firestore and shown on the feedback page.

### 2. Resume Analyzer

- Accepts resume uploads.
- Extracts text from PDF files using `pdfjs-dist`.
- Sends extracted content to Gemini for structured resume review.
- Returns:
  - resume score
  - ATS compatibility
  - strengths
  - weaknesses
  - improvement suggestions
  - recommended roles

### 3. Career Roadmap Generator

- Generates a step-by-step transition plan from current role to target role.
- Returns milestone titles, descriptions, and suggested durations.

### 4. Cover Letter Generator

- Creates personalized cover letters based on job title, company name, and extra candidate details.
- Supports quick copy-to-clipboard.

### 5. Company Research Assistant

- Generates company information sections using Gemini.
- Includes overview, culture, latest news, key facts, customer reviews, financials, and competitors.

### 6. Interview Q&A Generator

- Produces interview questions and sample answers for a topic, skill, or role.
- Answers are rendered with Markdown support for better readability.

### 7. Job Search

- Uses RapidAPI JSearch integration to search real job listings.
- Supports keyword, location, and employment type filtering.
- Includes pagination and outbound apply links.

### 8. Study Material Library

- Displays categorized study resources such as HR, DSA, frontend, backend, cloud, databases, networking, and more.
- Supports keyword search and category filters.

### 9. Expert Booking

- Shows a curated list of mock interview experts and mentors.
- Lets users contact experts directly through WhatsApp links.

### 10. Dashboard Overview

- Shows past interview submissions for the authenticated user.
- Reads interview history from Firestore in real time.
- Displays status, score, and feedback summaries.

### 11. Authentication

- Email/password signup and login via Firebase Authentication.
- Google sign-in via Firebase popup flow.
- Forgot password support via Firebase password reset email.

### 12. AI Chatbot

- Floating chatbot inside the dashboard.
- Uses Gemini to answer general user questions.

### 13. Coding Playground

- Includes preloaded coding questions across difficulty levels.
- Supports JavaScript, Python, and C++ editors via CodeMirror.
- Saves code locally in browser storage.
- Expects a code execution API at `/api/execute`.

### 14. Puzzle Game

- Includes a lightweight gamified interaction with confetti-based feedback.

## Tech Stack

### Frontend

- React 19
- Vite 6
- React Router DOM 7
- Tailwind CSS 4
- Framer Motion
- React Icons
- React Markdown
- React Toastify

### AI and Voice

- Google Gemini via `@google/generative-ai`
- Vapi Web SDK via `@vapi-ai/web`

### Backend Services

- Firebase Authentication
- Firebase Firestore

### Document and Editor Tooling

- `pdfjs-dist` for PDF resume parsing
- `@uiw/react-codemirror`
- CodeMirror language packages for JavaScript, Python, and C++

### Data and Visualization

- Recharts

### Other Libraries

- `canvas-confetti`
- `react-scroll`
- `react-webcam`
- `typewriter-effect`

## Application Flow

### User onboarding flow

1. User visits the landing page.
2. User signs up or logs in with email/password or Google.
3. User is redirected to the dashboard.

### Interview flow

1. User opens the dashboard.
2. User fills the interview form.
3. Gemini generates interview questions.
4. Submission is stored in Firestore.
5. Voice interview starts with Vapi.
6. Responses are captured as transcript entries.
7. Gemini evaluates transcript quality after the call ends.
8. Feedback and scores are saved to Firestore.
9. Dashboard and feedback page display the final result.

### Support tooling flow

Users can independently access:

- resume analysis
- job search
- company research
- cover letter generation
- career roadmap generation
- interview Q&A generation
- study materials
- expert booking
- coding practice

## Project Structure

```text
InterVuePrep/
├── public/
├── src/
│   ├── Authentication/
│   ├── Components/
│   ├── Pages/
│   ├── assets/
│   ├── context/
│   ├── App.jsx
│   ├── firebase.js
│   ├── index.css
│   └── main.jsx
├── dist/
├── .env.example
├── package.json
├── vite.config.js
├── eslint.config.js
├── Architecture.pdf
└── Architecture1.drawio.png
```

### Important folders

- `src/Pages` contains route-level pages such as home, dashboard, AI interview, interview form, feedback, and fallback pages.
- `src/Components` contains feature modules like Resume Analyzer, Job Search, Expert Booking, Chatbot, Code Playground, and others.
- `src/Authentication` contains signup/login and forgot-password screens.
- `src/context` contains the local auth context wrapper.
- `src/firebase.js` centralizes Firebase initialization.

## Environment Variables

Create a `.env` file in the project root and copy values from `.env.example`.

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GEMINI_API_KEY=
VITE_RAPIDAPI_KEY=
VITE_VAPI_API_KEY=
```

### Variable details

- `VITE_FIREBASE_API_KEY`: Firebase web app API key
- `VITE_FIREBASE_AUTH_DOMAIN`: Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID`: Firebase project id
- `VITE_FIREBASE_STORAGE_BUCKET`: Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender id
- `VITE_FIREBASE_APP_ID`: Firebase app id
- `VITE_GEMINI_API_KEY`: Gemini API key used across AI modules
- `VITE_RAPIDAPI_KEY`: RapidAPI key for JSearch job search
- `VITE_VAPI_API_KEY`: Vapi client key for voice interview sessions

## Getting Started

### Prerequisites

- Node.js 18 or later recommended
- npm
- Firebase project
- Gemini API access
- Vapi account and configured assistant/provider setup
- RapidAPI account for JSearch if job search is required

### Installation

1. Clone the repository:

```bash
git clone <your-repository-url>
cd InterVuePrep
```

2. Install dependencies:

```bash
npm install
```

3. Create your environment file:

```bash
copy .env.example .env
```

4. Fill all required environment variables in `.env`.

5. Start the development server:

```bash
npm run dev
```

6. Open the app in your browser, typically at:

```text
http://localhost:5173
```

## Available Scripts

- `npm run dev` starts the Vite development server
- `npm run build` creates the production build
- `npm run preview` previews the production build locally
- `npm run lint` runs ESLint

## Firebase Usage

Firebase is used in two main areas.

### Authentication

- email/password signup
- email/password login
- Google sign-in
- password reset
- browser local persistence

### Firestore collections used by the app

- `users`
  - stores user profile basics such as name, email, and role
- `interview_submissions`
  - stores generated interview question sets, interview metadata, transcript, scores, and feedback
- `contacts`
  - stores messages submitted through the contact form

### Firestore usage examples in the app

- `SignupPage.jsx` creates `users` records
- `InterviewFormPage.jsx` adds `interview_submissions`
- `AIInterviewPage.jsx` updates interview records with completion data
- `DashboardOverview.jsx` reads user-specific interview history
- `ContactUs.jsx` writes contact requests

## AI Integrations

### Gemini

Gemini is used in these modules:

- interview question generation
- transcript-based feedback generation
- resume analysis
- career roadmap generation
- cover letter generation
- company overview generation
- interview Q&A generation
- dashboard chatbot

Most modules use `gemini-2.5-flash`, and some include `gemini-2.5-flash-lite` fallback logic for retry scenarios.

### Vapi

Vapi powers the live voice interview experience:

- initializes a voice assistant session
- configures assistant persona and instructions
- handles call lifecycle events
- captures user transcripts
- enables microphone-based interview practice

## Key Screens and Modules

### Public pages

- Landing page
- Learn More page
- Signup/Login page
- Forgot Password page

### Dashboard routes

- Dashboard overview
- Resume analyzer
- Career roadmap generator
- Cover letter generator
- Company overview
- Expert booking
- Interview form
- Start interview
- Interview Q&A generator
- Feedback page
- Job search
- Study material

### Standalone routes

- `/code` for coding playground
- `/job` for job search
- `/puzzle` for puzzle game

## Known Limitations and Gaps

This section is important if you want to run or extend the project.

### 1. Code execution backend is missing

The coding playground sends requests to:

```text
/api/execute
```

That backend endpoint is not present in this repository, so code execution will not work until a compatible API is added.

### 2. Study material PDF assets are not included

The Study Material module expects files such as:

- `/pdfs/hr.pdf`
- `/pdfs/dsa.pdf`
- `/pdfs/frontend.pdf`

Those files are not currently present in the `public` folder, so downloads will fail unless the assets are added.

### 3. Company research relies on model knowledge

The Company Overview feature asks Gemini for sections like latest news and financials, but the app does not currently use a live web-search or finance API. The accuracy of recent company data depends on the model response.

### 4. Protected route handling is incomplete

A `ProtectedRoute` component exists, but the main route tree does not consistently use it. Some dashboard functionality may rely more on Firebase auth state than route-level guards.

### 5. Auth context is simplified

The custom `AuthContext` uses local storage token placeholders and is separate from Firebase auth state. Firebase auth is the real source of truth in several important screens.

### 6. Expert booking is static

Experts are currently hardcoded rather than fetched from a backend or admin-managed CMS.

### 7. Some dependencies are present but lightly used

The project includes packages like `react-webcam`, `recharts`, and `typewriter-effect`, but they are not central across all flows in the current codebase.

## Deployment Notes

For production deployment, make sure you configure:

- Firebase Authentication allowed domains
- Firestore security rules
- environment variables in the hosting platform
- Vapi assistant and provider credentials
- RapidAPI key if job search is enabled
- a real `/api/execute` backend if the coding playground should run code

Good deployment targets for the frontend include:

- Vercel
- Netlify
- Firebase Hosting

If you deploy to a static host, remember that the coding playground still needs a separate execution backend.

## Architecture Assets

The repository already includes architecture references:

- `Architecture.pdf`
- `Architecture1.drawio.png`

These can be used to expand the technical documentation further or support presentation/demo material.

## Future Improvements

- Add a real backend service for code execution
- Add role-based route guards using Firebase auth
- Replace static expert data with Firestore or admin-managed data
- Add live company/news APIs for more reliable company research
- Add interview recording or playback
- Add analytics and progress insights
- Add unit and integration tests
- Add CI/CD automation
- Add Firestore schema documentation
- Add admin dashboard for content and mentor management

## Contributing

Contributions are welcome.

### Suggested contribution areas

- bug fixes
- UI/UX refinement
- stronger auth and route protection
- backend support for code execution
- study material asset management
- improved Firestore data modeling
- testing and automation

### Basic contribution flow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run lint and build checks
5. Open a pull request

## Contact

For questions, feedback, or collaboration:

**Email:** `abhi28works@gmail.com`
