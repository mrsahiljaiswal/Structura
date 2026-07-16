# Frontend Implementation Guide

This document is the day-to-day implementation manual derived from the **Structura Frontend Redesign RFC**. It breaks down the bottom-up development strategy into **10 distinct milestones**. 

Every milestone is designed to build on the primitives established in previous milestones. Do not skip phases, duplicate styling, or write page-specific primitives.

---

## Milestone 1: Design Tokens

### Goal
Establish the design foundations (colors, spacing, radius, typography, motion, elevation, gradients) as clean React primitives and update the global CSS framework.

### Inputs
- `src/app/globals.css` (existing stylesheet)
- RFC design token guidelines.

### Deliverables
- [NEW] `src/design/colors.ts`
- [NEW] `src/design/spacing.ts`
- [NEW] `src/design/radius.ts`
- [NEW] `src/design/typography.ts`
- [NEW] `src/design/elevation.ts`
- [NEW] `src/design/gradients.ts`
- [NEW] `src/design/motion.ts`
- [NEW] `src/design/tokens.ts` (aggregating file)
- [MODIFY] `src/app/globals.css` (mapping tokens to CSS variables and themes)

### Folder Structure
```
src/
└── design/
    ├── colors.ts
    ├── spacing.ts
    ├── typography.ts
    ├── radius.ts
    ├── elevation.ts
    ├── gradients.ts
    ├── motion.ts
    └── tokens.ts
```

### Acceptance Criteria
- [ ] No hardcoded color codes or layouts exist outside of `src/design/`.
- [ ] CSS variables are declared for `dark`, `light`, `system`, and `high-contrast` modes in `globals.css`.
- [ ] Running `npm run type-check` succeeds.

### Manual Verification Checklist
- Verify that CSS variables update correctly when toggle flags are appended to the HTML element.
- Confirm fonts (Geist Sans, Geist Mono) map to the typography tokens.

### Common Mistakes to Avoid
- **Avoid**: Hardcoding tailwind utility classes like `bg-[#0a0a0a]` or `rounded-xl` in the primitives.
- **Avoid**: Injecting React state or components into this directory.

### Commit Message for Completion
`feat(design): implement phase 0 design system tokens and theme CSS variables`

---

## Milestone 2: UI Primitives

### Goal
Build the core interactive atomic components (primitives) that will be consumed across all layouts and pages.

### Inputs
- Milestone 1 Design system tokens.
- `src/components/ui/button.tsx` (existing primitive).

### Deliverables
- [NEW] `src/components/ui/input.tsx`
- [NEW] `src/components/ui/textarea.tsx`
- [NEW] `src/components/ui/card.tsx` (glassmorphic surface)
- [NEW] `src/components/ui/badge.tsx` (DifficultyBadge, ReadingTimeBadge)
- [NEW] `src/components/ui/progress.tsx` (Radial ring + Linear progress)
- [NEW] `src/components/ui/skeleton.tsx`
- [NEW] `src/components/ui/dialog.tsx` (modal box wrapper)
- [NEW] `src/components/ui/toast.tsx` (Framer Motion toasts panel)
- [NEW] `src/components/ui/avatar.tsx`
- [NEW] `src/components/ui/spinner.tsx` (status loading indicators)
- [NEW] `src/components/ui/tooltip.tsx`
- [MODIFY] `src/components/ui/button.tsx` (updated for design tokens)
- [NEW] `src/components/ui/index.ts` (barrel export file)

### Folder Structure
```
src/
└── components/
    └── ui/
        ├── button.tsx
        ├── input.tsx
        ├── textarea.tsx
        ├── card.tsx
        ├── badge.tsx
        ├── progress.tsx
        ├── skeleton.tsx
        ├── dialog.tsx
        ├── toast.tsx
        ├── avatar.tsx
        ├── spinner.tsx
        ├── tooltip.tsx
        └── index.ts
```

### Acceptance Criteria
- [ ] Every primitive supports loading, disabled, focus, and hover states.
- [ ] Every component is strictly typed with clear Prop interfaces.
- [ ] Primitives adapt automatically to Dark and Light modes using CSS variables.
- [ ] Accessibility: Focus outlines are visible, and ARIA labels are mapped.

### Manual Verification Checklist
- Test keyboard tab navigation on `Button` and `Input` to verify outline focus indicators.
- Call `toast.success("Test")` and `toast.error("Test")` to verify animation timings.

### Common Mistakes to Avoid
- **Avoid**: Importing Axios, routers, or global context in these primitives.
- **Avoid**: Hardcoding sizes or colors; use styled objects mapping to `src/design/`.

### Commit Message for Completion
`feat(ui): create atomic UI primitives with states, keyboard outlines and barrel exports`

---

## Milestone 3: Shared Components

### Goal
Implement global, app-wide controls that manage layouts, search indices, and navigation headers.

### Inputs
- Milestone 2 UI Primitives.
- Keyboard shortcuts guidelines (`Ctrl+K`, `Ctrl+U`, etc.).

### Deliverables
- [NEW] `src/components/shared/sidebar.tsx` (collapsible, recents tracker)
- [NEW] `src/components/shared/navbar.tsx` (user avatar, triggers)
- [NEW] `src/components/shared/command-palette.tsx` (Universal CommandCenter)
- [NEW] `src/components/shared/search-bar.tsx`
- [NEW] `src/components/shared/theme-switcher.tsx`
- [NEW] `src/components/shared/breadcrumb.tsx`
- [NEW] `src/components/shared/floating-ai-button.tsx`
- [NEW] `src/components/shared/empty-state.tsx`
- [NEW] `src/lib/hooks/use-keyboard-shortcuts.ts`
- [NEW] `src/components/shared/index.ts` (barrel export file)

### Folder Structure
```
src/
├── components/
│   └── shared/
│       ├── sidebar.tsx
│       ├── navbar.tsx
│       ├── command-palette.tsx
│       ├── search-bar.tsx
│       ├── theme-switcher.tsx
│       ├── breadcrumb.tsx
│       ├── floating-ai-button.tsx
│       ├── empty-state.tsx
│       └── index.ts
└── lib/
    └── hooks/
        └── use-keyboard-shortcuts.ts
```

### Acceptance Criteria
- [ ] Command Palette loads via `⌘K` or `Ctrl K`.
- [ ] Command Palette supports nested lists (Pages search, Courses, Lessons, Commands).
- [ ] Sidebar collapses/expands smoothly with dynamic icons.
- [ ] Floating AI Button stays in the bottom-right corner and supports simple click overlays.

### Manual Verification Checklist
- Hit `Ctrl K` on various viewports to verify overlay and screen reader tags.
- Verify sidebar collapses and transitions from 64px to 256px wide.

### Common Mistakes to Avoid
- **Avoid**: Storing massive data indexes inside the component state; abstract search actions.

### Commit Message for Completion
`feat(shared): build sidebar, navbar, command-palette, and keyboard shortcut hooks`

---

## Milestone 4: Layouts

### Goal
Construct specialized page layouts that decouple content components from standard layout headers and side bars.

### Inputs
- Milestone 3 Shared Components.
- Next.js layouts model.

### Deliverables
- [NEW] `src/components/layouts/dashboard-layout.tsx`
- [NEW] `src/components/layouts/reader-layout.tsx` (3-column technical layout)
- [NEW] `src/components/layouts/upload-layout.tsx` (focused single panel)
- [NEW] `src/components/layouts/auth-layout.tsx` (centered login frame)
- [NEW] `src/components/layouts/index.ts` (barrel exports)

### Folder Structure
```
src/
└── components/
    └── layouts/
        ├── dashboard-layout.tsx
        ├── reader-layout.tsx
        ├── upload-layout.tsx
        ├── auth-layout.tsx
        └── index.ts
```

### Acceptance Criteria
- [ ] Layouts consume children slots and global shell components (Navbar, Sidebar).
- [ ] `ReaderLayout` locks side-columns during scroll, keeping only the center readable page scrollable.
- [ ] Layout templates adjust structure cleanly on Mobile displays.

### Manual Verification Checklist
- Resize browser and verify layouts adjust properly.
- Verify layout shells do not cause unnecessary re-renders on child page changes.

### Common Mistakes to Avoid
- **Avoid**: Hardcoding page title tags inside the layouts; always pass them dynamically or via Page props.

### Commit Message for Completion
`feat(layouts): implement dashboard, reader, upload, and auth layout templates`

---

## Milestone 5: Dashboard Page

### Goal
Redesign the main dashboard into a live, widgetized, high-fidelity hub displaying greeting streaks, quick action menus, and interactive SVG study analytics.

### Inputs
- Milestone 4 layouts.
- Dynamic persistence hook `useCourses` (local persistence layer).

### Deliverables
- [NEW] `src/lib/services/course-service.ts` (course registry layer)
- [NEW] `src/lib/hooks/use-courses.ts`
- [NEW] `src/components/dashboard/welcome-banner.tsx` (greeting streak indicator)
- [NEW] `src/components/dashboard/stat-card.tsx` (stats with mini SVG graphs)
- [NEW] `src/components/dashboard/recent-uploads.tsx`
- [MODIFY] `src/app/dashboard/page.tsx` (redesigned page composition)

### Folder Structure
```
src/
├── app/
│   └── dashboard/
│       └── page.tsx
├── components/
│   └── dashboard/
│       ├── welcome-banner.tsx
│       ├── stat-card.tsx
│       └── recent-uploads.tsx
└── lib/
    ├── services/
    │   └── course-service.ts
    └── hooks/
        └── use-courses.ts
```

### Acceptance Criteria
- [ ] Dashboard displays personalized welcome ("Good Morning Sahil") and streak tracking.
- [ ] Loaded course IDs are read from `useCourses()` registry.
- [ ] Skeletons load when resolving dynamic user info or courses lists.

### Manual Verification Checklist
- Clear local cache and verify empty state displays actionable instructions.
- Add mockup course IDs to local storage to verify recent courses list updates.

### Common Mistakes to Avoid
- **Avoid**: Direct Axios requests in page elements; all course lists route through `useCourses()`.

### Commit Message for Completion
`feat(dashboard): implement widgetized dashboard page, dynamic welcome, streaks, and useCourses hook`

---

## Milestone 6: Upload Page

### Goal
Rebuild the PDF upload panel to visualize the 9-stage generation pipeline timeline with estimated remaining times and state updates.

### Inputs
- `src/components/upload/upload-drop-zone.tsx` (existing upload logic).
- API endpoint details: `/api/v1/documents/upload`.

### Deliverables
- [NEW] `src/components/upload/pipeline-timeline.tsx` (timeline tracker)
- [NEW] `src/components/upload/upload-drop-zone.tsx` (redesigned)
- [MODIFY] `src/app/dashboard/upload/page.tsx`

### Folder Structure
```
src/
├── app/
│   └── dashboard/
│       └── upload/
│           └── page.tsx
└── components/
    └── upload/
        ├── pipeline-timeline.tsx
        └── upload-drop-zone.tsx
```

### Acceptance Criteria
- [ ] Dropzone presents clean animated hover indicators.
- [ ] Timeline details the 9 states: PDF Uploaded → Text Extracted → Normalizing → Semantic Chunking → Educational Planning → Writing Lessons → Reviewing → Final Assembly → Complete.
- [ ] Real-time updates match FastAPI server status responses.

### Manual Verification Checklist
- Trigger PDF upload and watch timeline animations transition from state to state.
- Check error screens trigger when non-PDF items are loaded.

### Common Mistakes to Avoid
- **Avoid**: Changing FastAPI POST parameters; keep document and file form payloads identical to the original implementation.

### Commit Message for Completion
`feat(upload): implement 9-stage pipeline timeline and upload dropzone redesign`

---

## Milestone 7: Course Page

### Goal
Create a course gallery layout (/dashboard/courses) and detailed chapter tree overviews (/dashboard/course/[courseId]).

### Inputs
- Backend REST API: `/api/v1/courses/{course_id}`.

### Deliverables
- [NEW] `src/app/dashboard/courses/page.tsx`
- [NEW] `src/components/courses/course-card.tsx` (decomposed)
- [NEW] `src/components/courses/course-thumbnail.tsx`
- [NEW] `src/components/courses/course-progress.tsx` (circular radial progress)
- [MODIFY] `src/app/dashboard/course/[courseId]/page.tsx`

### Folder Structure
```
src/
├── app/
│   └── dashboard/
│       ├── courses/
│       │   └── page.tsx
│       └── course/
│           └── [courseId]/
│               └── page.tsx
└── components/
    └── courses/
        ├── course-card.tsx
        ├── course-thumbnail.tsx
        └── course-progress.tsx
```

### Acceptance Criteria
- [ ] Courses display as premium cards featuring radial progress indicators and difficulty tags.
- [ ] Course details view displays collapsible chapter grids.
- [ ] Navigation is fast (<150ms route change latency targets).

### Manual Verification Checklist
- Load course and check radial progress fills to the exact completion percentage.
- Navigate between lessons and verify page layout structures mount with zero CLS.

### Common Mistakes to Avoid
- **Avoid**: Fetching course data in both card and overview lists simultaneously; cache details.

### Commit Message for Completion
`feat(courses): build courses gallery, card thumbnail, progress indicators, and course details tree`

---

## Milestone 8: Reader Page

### Goal
Build the immersive technical technical-book lesson reader featuring sticky scrolling indicators, a center reading pane (65-75 char width), and a local notepad panel.

### Inputs
- Backend GET `/lessons/{lesson_id}` and PATCH `/lessons/{lesson_id}/complete`.

### Deliverables
- [NEW] `src/components/reader/sticky-progress.tsx` (scroll depth indicator)
- [NEW] `src/components/reader/markdown-renderer.tsx` (custom prose rules)
- [NEW] `src/components/reader/notes-panel.tsx` (Markdown scratchpad)
- [NEW] `src/components/reader/practice-quiz.tsx` (quiz accordion)
- [MODIFY] `src/app/dashboard/lesson/[lessonId]/page.tsx`

### Folder Structure
```
src/
├── app/
│   └── dashboard/
│       └── lesson/
│           └── [lessonId]/
│               └── page.tsx
└── components/
    └── reader/
        ├── sticky-progress.tsx
        ├── markdown-renderer.tsx
        ├── notes-panel.tsx
        └── practice-quiz.tsx
```

### Acceptance Criteria
- [ ] Reader center column layout matches 65-75 character width limits for optimal focus.
- [ ] Code blocks render copy buttons; warning alerts display with custom highlight borders.
- [ ] Notes panel supports markdown inputs, checklists, and auto-saves local files to `localStorage`.
- [ ] Mark Complete patches backend and updates sidebar completion checkboxes.

### Manual Verification Checklist
- Scroll the lesson page and verify the top indicator reaches 100% at page bottom.
- Edit markdown notes, refresh, and confirm the editor reloads saved content.

### Common Mistakes to Avoid
- **Avoid**: Hardcoding standard prose blocks; style standard HTML heading tags to match design guidelines.

### Commit Message for Completion
`feat(reader): build premium technical lesson reader, sticky scroll indicator, markdown renderer, and local notes panel`

---

## Milestone 9: AI Tutor Page

### Goal
Create the AI Tutor page (/dashboard/tutor) and floating bottom action drawers featuring question recommendations and markdown messaging blocks.

### Inputs
- Course context data mappings.

### Deliverables
- [NEW] `src/app/dashboard/tutor/page.tsx`
- [NEW] `src/components/tutor/chat-messages.tsx`
- [NEW] `src/components/tutor/chat-input.tsx`
- [NEW] `src/components/tutor/suggested-prompts.tsx`

### Folder Structure
```
src/
├── app/
│   └── dashboard/
│       └── tutor/
│           └── page.tsx
└── components/
    └── tutor/
        ├── chat-messages.tsx
        ├── chat-input.tsx
        └── suggested-prompts.tsx
```

### Acceptance Criteria
- [ ] Chat panel delivers animated typing flows and structured message bubbles.
- [ ] Users can click suggested questions cards to trigger prompt values directly.
- [ ] floating AI assistant stays active throughout reader navigation.

### Manual Verification Checklist
- Open tutor page, input query, and confirm typing simulations complete with citation tags.
- Open floating button on reader, type query, and confirm it remains context-aware.

### Common Mistakes to Avoid
- **Avoid**: Hardcoding context variables; dynamically bind reading details.

### Commit Message for Completion
`feat(tutor): implement AI Tutor page, messaging widgets, suggested questions, and floating AI assistant`

---

## Milestone 10: Analytics, Settings & Release Polish

### Goal
Integrate settings pages, Clerk profile customizations, GitHub-style activity heatmaps, SVG study duration graphs, custom 404, loading skeleton shells, and complete accessibility audits.

### Inputs
- Global app state.

### Deliverables
- [NEW] `src/app/dashboard/analytics/page.tsx`
- [NEW] `src/app/dashboard/settings/page.tsx`
- [NEW] `src/app/not-found.tsx` (Custom 404 illustration)
- [NEW] `src/app/error.tsx` (Diagnostic error page)
- [NEW] `src/app/loading.tsx` (Global Suspense fallback)
- [NEW] `src/components/analytics/heatmap.tsx` (GitHub-style calendar)
- [NEW] `src/components/analytics/study-charts.tsx` (SVG graphs)
- [MODIFY] `src/app/page.tsx` (Landing page updates)

### Folder Structure
```
src/
├── app/
│   ├── dashboard/
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   ├── not-found.tsx
│   ├── error.tsx
│   └── loading.tsx
└── components/
    └── analytics/
        ├── heatmap.tsx
        └── study-charts.tsx
```

### Acceptance Criteria
- [ ] Settings panel renders Profile customization form and clear cache hooks.
- [ ] Heatmap renders study calendar cells dynamically.
- [ ] 404 page shows CSS-drawn empty space illustration.
- [ ] Light / dark / high-contrast themes adapt seamlessly across all routes.
- [ ] `npm run type-check`, `npm run lint`, and formatting pass without errors.

### Manual Verification Checklist
- Run a Lighthouse audit on desktop and mobile viewports to verify targets (>95 score).
- Click "Clear Cache" in settings and confirm recent lists are reset to empty layouts.

### Common Mistakes to Avoid
- **Avoid**: Using complex heavy external charting libraries; implement clean, lightweight SVG bars and coordinates.

### Commit Message for Completion
`feat(polish): finalize settings tabs, SVG analytics heatmap, custom 404/loading bounds, and accessibility release pass`
