# Backend Structure Document for evoting-sman1-bantarujeg

This document outlines the backend architecture, database setup, APIs, hosting environment, infrastructure components, security measures, and maintenance plan for the SMAN 1 Bantarujeg e-voting application. It’s written in clear, everyday language so that anyone can understand how the backend is organized and maintained.

## 1. Backend Architecture

### Overall Architecture
- We use a **modular, server-centric** design powered by Next.js (App Router). Pages and API routes live side by side under the `/app` directory, making it easy to group related code.
- Business logic—like authentication checks and vote recording—runs on the server side. React Server Components fetch data directly from the database, while Client Components handle interactive features (forms, dialogs).
- We follow simple, well-known patterns:
  - **MVC-ish separation**: API routes act as controllers, Drizzle ORM models represent data, and Next.js pages/views render the UI.
  - **Dependency injection** for database connections: We initialize one Drizzle client instance in `/db/index.ts` and share it across all API handlers.

### Scalability, Maintainability & Performance
- **Scalability**: Next.js apps on Vercel (or Docker with container orchestration) scale automatically—more instances spin up as traffic grows.
- **Maintainability**:
  - Code is organized into clear folders: `/app` (pages and API), `/components` (UI), `/db` (schema + connection), `/lib` (utilities/auth).
  - TypeScript enforces types end-to-end (from ORM to API inputs), reducing bugs.
- **Performance**:
  - Server Components fetch data without extra client-side bundles.
  - Built-in data caching (ISR or edge caching on Vercel) speeds up repeat requests.
  - Light, utility-first CSS (Tailwind) keeps bundle sizes small.

## 2. Database Management

### Technology Stack
- Database type: **Relational (SQL)**
- System: **PostgreSQL**
- ORM/Query Builder: **Drizzle ORM** (type-safe, migrations-supported)

### Data Structure & Access
- Data is organized into tables (admins, students, tokens, candidates, votes).
- Drizzle’s schema definitions in `/db/schema/*.ts` serve as the single source of truth—migrations generated from these files keep the database in sync.
- We use parameterized queries under the hood, guarding against SQL injection.
- Common practices:
  - **Migrations**: Every schema change is versioned and applied in a controlled way.
  - **Connection pooling**: The Drizzle client reuses connections.
  - **Transactions**: Critical operations (e.g., voting) run inside a transaction to maintain data integrity.

## 3. Database Schema

Below is the schema defined for PostgreSQL using SQL (human-readable). It matches our Drizzle definitions.

---

Table: **admins**  
  • id: serial primary key  
  • email: text unique not null  
  • password_hash: text not null  
  • created_at: timestamp default now()

Table: **students**  
  • id: serial primary key  
  • nis: varchar(20) unique not null  
  • name: text not null  
  • class: text not null  
  • has_voted: boolean default false  
  • created_at: timestamp default now()

Table: **tokens**  
  • token_value: varchar(64) primary key  
  • student_id: integer references students(id) on delete cascade  
  • expires_at: timestamp not null  
  • is_used: boolean default false

Table: **candidates**  
  • id: serial primary key  
  • name: text not null  
  • photo_url: text  
  • mission_statement: text

Table: **votes**  
  • id: serial primary key  
  • student_id: integer references students(id) on delete cascade  
  • candidate_id: integer references candidates(id) on delete cascade  
  • voted_at: timestamp default now()  
  • unique (student_id)

---

If you inspect `/db/schema`, you’ll see matching Drizzle definitions in TypeScript.

## 4. API Design and Endpoints

### Approach
- We use **RESTful API routes** (Next.js API `route.ts` files) co-located under `/app/api`.
- Endpoints return JSON and use standard HTTP verbs (GET, POST).
- All routes require authentication via middleware, except the login endpoints.

### Key Endpoints

1. **Authentication**
   - `POST /api/auth/login`  
     • Admins send `{ email, password }`.  
     • Students send `{ nis, token }`.
   - `POST /api/auth/logout`  
     • Clears session token.

2. **Student Management (Admin-only)**
   - `GET /api/students`  
     • List all students.
   - `POST /api/students`  
     • Bulk import or create one student.
   - `POST /api/students/:id/token`  
     • Generate a new voting token for a student.

3. **Candidate Management (Admin-only)**
   - `GET /api/candidates`  
     • List candidates.
   - `POST /api/candidates`  
     • Add a new candidate.
   - `PUT /api/candidates/:id`  
     • Update candidate details.
   - `DELETE /api/candidates/:id`  
     • Remove a candidate.

4. **Voting**
   - `GET /api/vote`  
     • Fetch active candidates (students only).
   - `POST /api/vote`  
     • Cast a vote: checks token validity, voting period flag, `has_voted` status, then records vote and marks token & student.

5. **Settings (Admin-only)**
   - `GET /api/settings`  
     • Fetch current election state (open/closed).
   - `PUT /api/settings`  
     • Toggle election state on or off.

Each route uses the Drizzle client to interact with the database and returns clear success/error messages.

## 5. Hosting Solutions

- **Primary Host**: Vercel (serverless functions for API routes, automatic scaling, global CDN).  
  • Benefits: zero-config deployments, built-in SSL, automatic global distribution.
- **Alternative**: Docker containers deployed on AWS ECS or DigitalOcean.  
  • Benefits: full control over runtime, easier integration with private VPC, custom scaling policies.

Both options support automatic rollbacks, environment variable management, and easy CI/CD.

## 6. Infrastructure Components

- **Load Balancer / Edge Network**  
  • On Vercel, requests automatically route to the nearest edge location.  
  • In a Docker setup, an AWS ALB or NGINX can distribute traffic across containers.

- **Cache / CDN**  
  • Static assets (CSS, images) served by Vercel’s CDN.  
  • We can introduce Redis for caching database-heavy endpoints (e.g., candidate list or election settings) if needed.

- **Database Hosting**  
  • Managed PostgreSQL (e.g., AWS RDS, ElephantSQL) with daily backups and high availability.

- **Email/Notification Service** (optional)  
  • For sending token emails to students, we can integrate SendGrid or Mailgun.

## 7. Security Measures

- **Authentication & Authorization**  
  • Passwords hashed with bcrypt.  
  • Students authenticated via one-time tokens stored in the `tokens` table.  
  • Role checks ensure only admins can access admin APIs.

- **Data Encryption**  
  • All traffic over HTTPS.  
  • Database connections via SSL.

- **Input Validation & Sanitization**  
  • Use Zod schemas on every API route to validate request bodies.  
  • Reject malformed or malicious inputs early.

- **Session Management**  
  • Signed HTTP-only cookies for sessions.  
  • Short token lifetimes and secure cookie flags.

- **Compliance**  
  • No sensitive data (e.g., raw tokens) is logged.  
  • GDPR-style data access policies can be added if needed.

## 8. Monitoring and Maintenance

- **Performance Monitoring**  
  • Vercel Analytics for request metrics (latency, error rates).  
  • Optionally integrate Sentry for error tracking.

- **Logging**  
  • API errors and key events (login attempts, vote submissions) logged to a centralized service (e.g., Datadog, Logflare).

- **Database Health**  
  • Automated backups and periodic restore tests.  
  • Use built-in PostgreSQL monitoring dashboards.

- **Maintenance Strategy**  
  • Schema changes applied via Drizzle migrations in CI.  
  • Regular dependency updates with automated tests.
  • Scheduled downtime communicated in advance when doing major upgrades.

## 9. Conclusion and Overall Backend Summary

The backend for the SMAN 1 Bantarujeg e-voting application is built on a modern, scalable stack:
- Next.js with serverless functions (or Docker containers) for flexible hosting.  
- PostgreSQL managed via Drizzle ORM for type safety and reliable migrations.  
- Clear RESTful APIs protecting key operations (authentication, student/candidate management, voting, settings).  
- Strong security practices: hashed passwords, token-based student login, HTTPS, input validation.  
- Cloud-ready hosting on Vercel (or containerized on AWS/DigitalOcean) with global CDN, auto-scaling, and zero-downtime deployments.

This setup ensures the e-voting system can handle growth, remain secure, and be easy to maintain—providing a solid foundation for delivering a smooth, trustworthy voting experience to both administrators and students.