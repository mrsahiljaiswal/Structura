# 🚀 Structura Frontend Application

This is the Next.js 15 client application for the Structura e-course platform. It is styled with a modern dark glassmorphic design system and integrates with Clerk Authentication, TanStack Query, and the FastAPI backend.

## Tech Stack

- **Next.js 15 (App Router)** & **React 19**
- **TypeScript**
- **Tailwind CSS v4** (CSS-first configurations)
- **TanStack React Query v5** (Client state management & API caching)
- **Framer Motion** (Smooth transitions & animations)
- **Clerk Auth** (User sign-up, sign-in, and auth gate middleware)

---

## Key Features & Pages Built

### 1. 🎛️ Dashboard Pages (`src/app/dashboard`)
- **Main Hub (`dashboard/page.tsx`)**: Displays enrolled courses list, dynamic statistics cards (completed lessons, overall quiz averages, and daily streak counts), and interactive study time charts.
- **AI Study Tutor (`dashboard/tutor/page.tsx`)**: 3-feature workspace:
  - *Course-Grounded RAG Chat*: Conversations strictly scoped to selected course texts.
  - *Socratic Concept Explainer*: Breaks down terms into four levels (ELI5, Analogy, Deep Academic, and Misconceptions).
  - *Practice Challenge Generator*: Produces custom interactive quizzes (Multiple Choice, True/False, Mixed) on demand.
- **Interactive Reader (`dashboard/course/[id]/page.tsx`)**: Features:
  - Sidebar lesson navigation hierarchy.
  - Custom SVG-rendered concept flowchart mind maps.
  - Markdown lesson viewer with glowing text highlighting on query redirect.
  - Built-in audio narrator with double `speechSynthesis.cancel()` loops preventing voice leaks.
  - Dynamic practice quizzes styled with emerald/rose answer keys and scorecard tallies.

### 2. 🛡️ Route Middleware (`src/middleware.ts`)
- Restricts dashboard access to authenticated users via Clerk verification hooks.

### 3. 🎨 Dark Glassmorphic Theme System
- Integrated shadcn/ui components customized inside `src/app/globals.css` using modern color tokens and hover animations.

---

## Setup & Running Locally

### Prerequisites
- Node.js 18+ & npm
- A running instance of the FastAPI backend on port 8000

### 1. Installation
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file inside the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL="http://localhost:8000"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
CLERK_SECRET_KEY="your-clerk-secret-key"
```

### 3. Start Development Server
```bash
npm run dev
```
Open http://localhost:3000 to explore the application dashboard.

