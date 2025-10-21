# Tech Stack Document for evoting-sman1-bantarujeg

This document explains, in everyday language, the technologies used to build the SMAN 1 Bantarujeg e-voting application. Each section describes the tools and services chosen, why they were selected, and how they work together to deliver a secure, user-friendly voting platform.

## Frontend Technologies

We’ve picked modern, widely-used tools to create a responsive and accessible interface for both administrators and students.

- **Next.js (App Router)**
  - Provides server-side rendering (SSR) and client-side navigation for fast page loads and real-time updates.
  - Lets us colocate API routes and pages, simplifying development and security.

- **TypeScript**
  - Adds type safety to JavaScript, helping catch errors early and making the code easier to maintain.

- **shadcn/ui (based on Radix UI)**
  - A library of ready-made UI components (buttons, forms, tables, dialogs, cards).
  - Ensures consistent, accessible design without building every control from scratch.

- **Tailwind CSS v4**
  - A utility-first styling framework that lets us rapidly build custom designs using simple class names.
  - Supports dark and light mode out of the box, matching the school’s branding needs.

- **Zod (for input validation)**
  - Validates form inputs (NIS, tokens, admin entries) on both server and client sides.
  - Prevents malformed or malicious data from reaching our database.

## Backend Technologies

The server side combines solid frameworks and a type-safe database layer to handle authentication, voting logic, and data storage.

- **Next.js API Routes**
  - Handle authentication, voting submission, and admin actions in the same codebase as our frontend.
  - Securely process requests, check permissions, and return data without needing a separate server.

- **Better Auth (or similar authentication library)**
  - Manages email/password sign-in for admins and token-based login for students.
  - Customizable to validate NIS and single-use tokens against our database.

- **Drizzle ORM**
  - A type-safe layer for interacting with PostgreSQL.
  - Defines our tables (admins, students, tokens, candidates, votes) in code to keep schema and queries in sync.

- **PostgreSQL**
  - An open-source relational database known for reliability and data integrity.
  - Stores critical election data: student records, voting tokens, candidate info, and vote tallies.

## Infrastructure and Deployment

Our infrastructure choices make development smooth and ensure the application can grow securely.

- **Version Control: Git & GitHub**
  - Tracks all code changes, supports review workflows, and lets multiple developers collaborate safely.

- **Hosting: Vercel (or Docker on any cloud)**
  - Vercel offers zero-config deployments for Next.js apps, with automatic previews for pull requests.
  - Docker provides consistent environments if you prefer self-hosting or another cloud provider.

- **CI/CD Pipeline: GitHub Actions**
  - Automatically runs tests, lints code, and deploys to Vercel (or builds Docker images) on every push.
  - Ensures new features don’t break existing functionality before going live.

- **Environment Variables Management**
  - Stores database URLs, secret keys, and API credentials securely, preventing accidental exposure in code.

## Third-Party Integrations

To save development time and add advanced features, we rely on a few trusted services.

- **Authentication Provider (Better Auth or NextAuth.js)**
  - Handles session management, password hashing, and token validation.
  - Simplifies adding two login methods (email/password for admins, NIS/token for students).

- **Email Service (optional)**
  - Can send token-reset or invitation emails to students and admins (e.g., SendGrid, Mailgun).

- **Monitoring & Analytics (optional)**
  - Tools like Sentry or LogRocket to track errors, performance issues, and user interactions in production.

## Security and Performance Considerations

We’ve built in multiple layers of protection and optimization to keep the voting process smooth and tamper-proof.

Security Measures:
- **Route Protection & Middleware**
  - Next.js middleware checks user sessions before granting access to admin dashboards or voting pages.
- **Single-Use Tokens**
  - Each student token can only be used once, and the system marks it as "used" to prevent reuse.
- **Data Encryption & Secure Storage**
  - Connections to PostgreSQL use SSL/TLS to protect data in transit.
- **Input Validation (Zod)**
  - Validates all user-submitted data against strict schemas to stop injection attacks and invalid entries.
- **Role-Based Access**
  - Separate login flows and permissions for admins vs. students, ensuring each user sees only what they’re supposed to.

Performance Optimizations:
- **Server-Side Rendering (SSR)**
  - Pre-renders pages on the server for faster initial load and better SEO if needed for public pages.
- **Client-Side Caching**
  - React Query or built-in SWR can cache API responses to reduce repeated requests.
- **Modular Code Splitting**
  - Next.js automatically splits code per page, so students only download what they need when voting.
- **Image Optimization**
  - Next.js Image component serves appropriately sized images for candidate photos, reducing bandwidth.

## Conclusion and Overall Tech Stack Summary

By combining Next.js with TypeScript, a component-rich UI library, and a type-safe database layer, we’ve built a reliable foundation for the SMAN 1 Bantarujeg e-voting system. Key highlights:

- **User-Friendly Interfaces:** Tailwind CSS and shadcn/ui ensure consistent, accessible screens for admins and students.
- **Secure Authentication:** Dual login flows (email/password and NIS/token) with strong protections against token reuse and unauthorized access.
- **Scalable Backend:** Next.js API routes and Drizzle ORM give us a clear, maintainable codebase that scales with future requirements.
- **Smooth Deployment:** Vercel and GitHub Actions automate testing and deployment, minimizing downtime.

This tech stack aligns with the project’s goals: a secure, easy-to-use, and maintainable e-voting platform that can grow with the needs of SMAN 1 Bantarujeg.