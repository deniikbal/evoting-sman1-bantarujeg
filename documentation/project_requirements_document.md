# Project Requirements Document: evoting-sman1-bantarujeg

## 1. Project Overview

This project is an electronic voting (e-voting) system tailored for SMAN 1 Bantarujeg. It provides two portals: one for administrators to manage students, voting tokens, candidates, and election settings; and one for students to securely log in and cast their votes. By moving from paper ballots to a web-based workflow, the system aims to increase efficiency, reduce errors, and ensure that each student can vote exactly once in a transparent and auditable manner.

We’re building this because the school needs a modern, reliable way to run student council elections without the delays and manual work of paper voting. Key success criteria include: 1) secure, one-time voting per student; 2) a simple admin interface for managing elections; 3) a straightforward student experience with minimal friction; and 4) robust audit logs and data integrity backed by PostgreSQL and type-safe Drizzle ORM.

## 2. In-Scope vs. Out-of-Scope

In-Scope (Version 1):
- Admin authentication with email/password
- Student authentication with NIS (student ID) + single-use token
- Admin Dashboard: manage student records, generate and revoke tokens
- Candidate management (add, edit, delete)
- Voting period toggle (on/off switch)
- Student Voting Page: view candidate cards, cast a vote
- Secure API endpoints for authentication and voting logic
- PostgreSQL database with Drizzle ORM schema for students, tokens, candidates, votes
- UI components using shadcn/ui (Radix UI) and Tailwind CSS for a consistent look
- Dark/light theme toggle and responsive design for mobile and desktop
- Input validation (e.g., via Zod) and clear error messages

Out-of-Scope (Phase 2+):
- Support for multiple concurrent elections
- Real-time election result charts or websockets
- SMS or email notifications for token delivery
- Social login or Single Sign-On (SSO)
- Advanced analytics or reporting dashboards
- Offline voting or ballot printing

## 3. User Flow

When a student arrives at the system, they land on the login page and choose the “Student” flow. They enter their NIS and the unique token provided by the admin. After submission, the system verifies credentials, checks that the voting period is active, and confirms the token has not been used. If all checks pass, the student is redirected to the voting screen, where they see candidate cards (photo, name, mission). They click one card, submit their vote, and see a confirmation message. The system then marks their token as used and sets their `has_voted` flag in the database.

An administrator navigates to the admin login page and enters their email and password. Upon successful login, they land on the Admin Dashboard, which features a sidebar menu with links to “Students,” “Candidates,” “Voting Settings,” and “Dashboard Home.” In “Students,” they upload or manage the student list and generate one-time tokens. In “Candidates,” they add/edit/delete candidate profiles. In “Voting Settings,” they toggle the election on or off. Throughout the process, admins can view summary stats (e.g., tokens generated, votes cast) and ensure the system is configured correctly before opening or closing the election period.

## 4. Core Features

- **Authentication**
  • Admin: email/password flow
  • Student: NIS + single-use token flow
- **Admin Dashboard**
  • Student management (CRUD, import list)
  • Token generation and revocation
  • Candidate management (CRUD)
  • Voting period on/off toggle
  • Summary statistics (students, tokens, votes)
- **Student Voting Interface**
  • Candidate display (cards with photo, name, statement)
  • Single-vote submission form
  • Confirmation and prevention of re-voting
- **API Endpoints**
  • `/api/auth` (custom NIS/token verification)
  • `/api/vote` (secure vote recording with checks)
  • Protected routes enforced by Next.js middleware
- **Database Schema (Drizzle ORM + PostgreSQL)**
  • `admins`, `students`, `tokens`, `candidates`, `votes` tables
  • Migrations to manage schema changes
- **UI Components & Theming**
  • shadcn/ui (Radix-based) components (tables, forms, dialogs)
  • Tailwind CSS for styling
  • Dark/light mode toggle
- **Validation & Error Handling**
  • Input schemas (Zod) for forms
  • User-friendly error messages (invalid token, voting closed)
- **Responsive Design & Accessibility**
  • Mobile-first layouts, ARIA attributes, keyboard navigation

## 5. Tech Stack & Tools

- **Frontend:** Next.js (App Router), React, TypeScript
- **Styling/UI:** Tailwind CSS v4, shadcn/ui (Radix UI)
- **Authentication Library:** Better Auth (or similar, customized)
- **Database & ORM:** PostgreSQL, Drizzle ORM
- **Server-Side Logic:** Next.js API routes
- **Validation:** Zod (input schemas)
- **Deployment:** Vercel (or Docker + container registry)
- **IDE Plugins (optional):** Cursor AI for code suggestions

## 6. Non-Functional Requirements

- **Performance:** Page load in under 2 seconds; API response under 300 ms
- **Security:** HTTPS everywhere; CSRF protection; hashed passwords; token encryption at rest
- **Data Integrity:** ACID transactions for vote recording; no race conditions
- **Usability:** WCAG 2.1 AA accessibility compliance; responsive on desktop/mobile
- **Reliability:** 99.9% uptime; automated backups of the PostgreSQL database

## 7. Constraints & Assumptions

- **Constraints:** Must run on Next.js App Router; use Drizzle ORM migrations; rely on PostgreSQL; adhere to school’s firewall rules
- **Assumptions:** Student list and tokens are managed offline/imported; admin credentials are pre-registered; voting period schedule is controlled via UI; Vercel environment variables can store DB URLs and secrets

## 8. Known Issues & Potential Pitfalls

- **Token Reuse & Race Conditions:** Two simultaneous vote submissions could bypass the `is_used` check. Mitigation: wrap vote creation and token update in a DB transaction with row-level locks.
- **Migration Drift:** Manual schema edits may conflict with Drizzle migrations. Mitigation: always update the schema file first and run `drizzle-kit migrate`.
- **Invalid Token Handling:** Users entering malformed tokens must see clear errors. Mitigation: use Zod to validate token format before hitting the database.
- **Long-Running Queries:** Generating reports in the admin UI could slow page loads. Mitigation: paginate results or move heavy queries to background jobs in Phase 2.

---
This document provides a clear, unambiguous blueprint for the e-voting system’s first version. All subsequent technical designs (tech stack details, frontend guidelines, backend APIs, file structures, tests) should directly reference and align with these requirements.