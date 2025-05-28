# For Your Health MVP — Project Status (as of 2025-05-28)

## Overview

This project is a Next.js-based MVP for a personalized health platform.  
It features user authentication, file uploads, a dashboard for health metrics, and a modern, modular UI scaffolded for future expansion.

---

## Tech Stack

- **Next.js (App Router, TypeScript)**
- **NextAuth.js** for authentication (credentials provider, JWT sessions)
- **Prisma** ORM (not all backend logic implemented yet)
- **Tailwind CSS** + custom CSS for styling
- **Chart.js** (planned for data visualization)
- **GitHub Actions** for CI (type-check, lint, test)

---

## Main Features & Pages

- **Authentication:**  
  - Login and registration pages, styled to match the dashboard.
  - Session duration extended to 30 days for persistent login.
- **Main Layout:**  
  - Sidebar navigation with icons and active state.
  - Header with page title, subtitle, and quick action buttons.
  - Health Score widget in sidebar.
- **Dashboard:**  
  - Placeholder widgets for quick metrics, charts, and health insights.
  - (Planned: show uploaded health reports and analytics.)
- **AI Health Coach:**  
  - Placeholder chat UI for future AI health assistant.
- **Data Sources:**  
  - Styled upload widget for health reports (PDF, CSV, etc.).
  - Integration cards for Apple Health and Oura Ring (placeholders).
  - Connected sources section (placeholder).
- **Correlations, Trends, Reports, Settings:**  
  - All scaffolded with placeholder content/cards, ready for future logic.

---

## Current UX

- **Consistent, modern dashboard look:**  
  - Sidebar, header, cards, and forms all use the same color scheme and spacing.
- **Responsive session management:**  
  - Users stay logged in for 30 days.
- **Protected routes:**  
  - Dashboard and Data Sources require login for full functionality.
  - Friendly messages shown if not logged in.

---

## What’s NOT Yet Implemented

- Real backend logic for Apple Health/Oura integrations.
- AI chat/insights logic.
- Advanced analytics, correlations, or report generation.
- Mobile responsiveness (basic desktop layout only).
- Full error handling and edge-case UX.

---

## Example Directory Structure

```
/app
  /dashboard/page.tsx
  /ai-coach/page.tsx
  /data-sources/page.tsx
  /correlations/page.tsx
  /trends/page.tsx
  /reports/page.tsx
  /settings/page.tsx
  /auth/login/page.tsx
/components
  /layout/Sidebar.tsx
  /layout/Header.tsx
  ...
/app/api/auth/[...nextauth]/route.ts
/app/api/upload/route.ts
...
/app/globals.css
```

---

## How to Run

1. `npm install`
2. Set up `.env` with `NEXTAUTH_SECRET` and any DB credentials.
3. `npm run dev`
4. Visit `http://localhost:3000`

---

## Next Steps

- Implement backend logic for health data integrations.
- Add real analytics, charts, and AI insights.
- Polish mobile responsiveness and error handling.

---

*This summary can be shared with any LLM or collaborator for context!*
