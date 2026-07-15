# frontend

Production-ready Next.js 15 project scaffold. This repo is configured only —
no application pages have been built yet.

## Stack

- **Next.js 15** (App Router, Turbopack dev server)
- **TypeScript** (strict mode)
- **Tailwind CSS v4** (CSS-first config, no `tailwind.config.js` needed)
- **ESLint 9** (flat config, `next/core-web-vitals` + `next/typescript`)
- **Prettier** (with `prettier-plugin-tailwindcss` for class sorting)
- **shadcn/ui** (`new-york` style, configured via `components.json`)
- **TanStack React Query v5** (client provider + SSR-safe query client)
- **React Hook Form** + **Zod** (+ `@hookform/resolvers`) for forms/validation
- **Axios** (shared instance with interceptors in `src/lib/axios.ts`)
- **Lucide React** for icons
- **Framer Motion** for animation

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app runs at http://localhost:3000. Note: no `page.tsx` has been created
yet, so the root route will 404 until you add one — that's expected for a
"configuration only" scaffold.

## Scripts

| Command              | Description                              |
| --------------------- | ----------------------------------------- |
| `npm run dev`          | Start the dev server (Turbopack)          |
| `npm run build`        | Production build                          |
| `npm run start`        | Start the production server               |
| `npm run lint`         | Lint with ESLint                          |
| `npm run lint:fix`     | Lint and auto-fix                         |
| `npm run format`       | Format with Prettier                      |
| `npm run format:check` | Check formatting without writing          |
| `npm run type-check`   | Run `tsc --noEmit`                        |

## Adding shadcn/ui components

The `Button` component (`src/components/ui/button.tsx`) is included as the
canonical example. Add more components with the CLI once dependencies are
installed:

```bash
npx shadcn@latest add input form dialog
```

## Project structure

```
src/
  app/
    layout.tsx      # Root layout (fonts, metadata, Providers)
    providers.tsx    # Client-side providers (React Query)
    globals.css      # Tailwind v4 import + shadcn/ui design tokens
  components/
    ui/              # shadcn/ui components
  hooks/             # Reusable client hooks
  lib/
    utils.ts         # cn() class-merge helper
    axios.ts         # Shared Axios instance
    query-client.ts  # SSR-safe React Query client factory
    env.ts           # Zod-validated environment variables
  types/             # Shared, app-wide types
```

## Environment variables

See `.env.example`. Copy it to `.env.local` and adjust as needed.
Variables are validated at startup via `src/lib/env.ts` (Zod).

## Notes

- This environment could not reach the npm registry, so `node_modules` and
  the lockfile were **not** generated here. Run `npm install` locally to
  install dependencies and produce a lockfile before committing.
- Tailwind v4 is configured CSS-first (`@import "tailwindcss"` +
  `@theme inline` in `globals.css`) — there is intentionally no
  `tailwind.config.ts`.
