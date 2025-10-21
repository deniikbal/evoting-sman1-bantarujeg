# Frontend Guideline Document

This document describes the frontend architecture, design principles, and technologies used in the `evoting-sman1-bantarujeg` project. It’s written in everyday language and explains how everything fits together so that any team member—technical or non-technical—can understand how the frontend is built.

## 1. Frontend Architecture

### Frameworks and Libraries
- **Next.js (App Router)**: The core framework for routing, server-side rendering, and API endpoints. It keeps our code modular and makes it easy to add pages or backend logic in the same project.
- **TypeScript**: Provides type safety across components and API routes, reducing bugs and improving code clarity.
- **shadcn/ui (based on Radix UI)**: A ready-made set of accessible UI components (buttons, tables, dialogs, forms) that we customize to fit our design.
- **Tailwind CSS v4**: A utility-first CSS framework for quick, consistent styling without writing custom CSS classes from scratch.
- **Better Auth (or similar)**: Handles user sign-in and sign-up flows, which we extend to support both Admin email/password and Student NIS/token logins.
- **Drizzle ORM**: A type-safe layer to define and query our PostgreSQL database schema, keeping data access clean and consistent.
- **PostgreSQL**: Our reliable relational database for storing users, students, tokens, candidates, and votes.

### Scalability, Maintainability, Performance
- **Modular Structure**: Next.js App Router enforces a clear folder layout (`app/`, `components/`, `db/`, `lib/`), making it easy to add or modify features without confusion.
- **Server & Client Components**: We fetch data securely on the server for admin dashboards while using client components for interactive student voting pages. This balances performance and user experience.
- **Type Safety with TypeScript and Drizzle**: Reduces runtime errors and makes refactoring safer as the project grows.
- **Built-in Code Splitting**: Next.js automatically splits JavaScript per page, so users only download what they need.

## 2. Design Principles

### Key Principles
1. **Usability**: Interfaces are straightforward. Forms, buttons, and feedback messages guide users through tasks like logging in, generating tokens, or casting a vote.
2. **Accessibility**: Components from shadcn/ui follow ARIA standards. We ensure keyboard navigation, proper color contrast, and meaningful labels.
3. **Responsiveness**: Layouts adapt seamlessly from desktop to mobile screens. Tailwind’s responsive utilities make this straightforward.
4. **Consistency**: A shared design system (colors, typography, spacing) ensures a coherent look across Admin and Student portals.

### Applying the Principles
- **Clear Feedback**: Error messages like “Invalid NIS or Token” show up immediately below form fields.
- **Logical Layouts**: Admin dashboards use tables and sidebars for quick data management; student voting uses card groups for easy selection.
- **Accessible Forms**: Every input has a label and focus state; dialogs trap focus until closed.

## 3. Styling and Theming

### Styling Approach
- **Utility-First with Tailwind CSS**: We compose classes like `bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100` directly in JSX for fast iteration.
- **No BEM or SASS**: Tailwind’s design encourages reuse without custom naming conventions.

### Theming
- **Light & Dark Mode Toggle**: Users can switch themes. We store preference in `localStorage` and apply the `dark` class on `<html>`.
- **Consistent Look**: All components respect theme colors and adapt automatically.

### Visual Style
- **Modern Flat Design with Subtle Glassmorphism**: Flat color blocks for structure; card components use a slight blur and translucent background for a modern, polished feel.

### Color Palette
- **Primary**: #0066FF (bright blue)
- **Secondary**: #00CC99 (teal)
- **Accent**: #FFAA00 (warm amber)
- **Background Light**: #F9FAFB
- **Background Dark**: #1F2937
- **Text Light**: #111827
- **Text Dark**: #F3F4F6

### Typography
- **Font Family**: "Inter", a clean, highly legible sans-serif from Google Fonts.
- **Scale**: 
  - Headings: 1.5rem – 2rem
  - Body: 1rem
  - Small / Captions: 0.875rem

## 4. Component Structure

### Organization
- **`/app`**: Page files and API route files. Each folder inside `app/` corresponds to a URL path.
- **`/components`**: Reusable UI pieces. Subfolders include `ui/` for shadcn/ui wrappers and project-specific atoms.
- **`/components/app-sidebar.tsx`**: Admin navigation menu with links to Dashboard, Students, Voting, Settings.

### Reuse and Maintainability
- **Atomic Components**: Buttons, Inputs, Dialogs live in `components/ui` and are used everywhere.
- **Layout Components**: DashboardLayout, VotingLayout wrap pages to enforce consistent margins, headers, and footers.
- **Extension**: New pages or widgets simply import existing UI pieces and compose them, reducing duplication.

## 5. State Management

### Approach
- **Server Components**: Fetch data (student lists, vote counts) directly in Next.js server components for the admin side.
- **Client State**: 
  - **React Context** for theme and authenticated user state (Admin vs. Student).
  - **Local component state** (`useState`) for form inputs and UI interactions.

### Data Fetching
- **Next.js `fetch` in Server Components**: Data is passed as props, so admin pages always show fresh results.
- **Client Fetch**: For student voting, we use built-in `fetch` in a client component after login, then render candidate cards.

## 6. Routing and Navigation

- **Next.js App Router**: Uses the `app/` folder. 
  - `/sign-in` → Student login (NIS + Token)
  - `/dashboard` → Admin portal (protected)
  - `/dashboard/students`, `/dashboard/voting`, `/dashboard/settings` → Admin sub-sections
  - `/vote` → Student voting page (protected)
- **Route Protection**: Next.js middleware checks cookies / session. Unauthenticated users get redirected to the sign-in page.
- **Sidebar Navigation**: A shared `AppSidebar` component provides links and highlights the active page.

## 7. Performance Optimization

- **Code Splitting**: Next.js automatically splits bundles per page.
- **Lazy Loading**: Large components or charts (e.g., live vote graphs) are dynamically imported when needed.
- **Image Optimization**: Use Next.js `<Image>` for candidate photos, which automatically optimizes formats and sizes.
- **Caching**: 
  - **Server Response Caching** for API routes that serve lists (e.g., students, candidates).
  - **Client-side Fetch Caching** (stale-while-revalidate) to reduce repeated data requests.

## 8. Testing and Quality Assurance

### Testing Strategies
1. **Unit Tests**: Test individual functions and small components (forms, utilities). 
2. **Integration Tests**: Combine components and test flows (e.g., login form submits correct payload).
3. **End-to-End (E2E) Tests**: Simulate real user scenarios using a tool like **Cypress** (login, vote, enforce no double voting).

### Tools and Frameworks
- **Jest** with **React Testing Library** for unit and integration tests.
- **Cypress** for E2E scenarios, including:
  - Student logs in with a valid token.
  - Student fails with invalid or used token.
  - Student casts a vote; vote is recorded.
  - Student cannot vote again.
- **Zod** (or similar) for runtime schema validation of API inputs and form data.
- **ESLint** and **Prettier** for code style and consistency.

## 9. Conclusion and Overall Frontend Summary

This guideline lays out how the e-voting frontend is built on a modern, scalable stack (Next.js, TypeScript, Tailwind CSS, shadcn/ui). We follow clear design principles—usability, accessibility, responsiveness—and use a component-based approach for maintainability. Dynamic theming, route protection, and performance optimizations ensure a polished user experience for both Admins and Students. The recommended testing strategy guards against regressions, especially in critical voting flows. By adhering to these guidelines, the team can efficiently build, extend, and maintain a secure, user-friendly e-voting system for SMAN 1 Bantarujeg.