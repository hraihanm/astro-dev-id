# AI Context & Documentation

> [!IMPORTANT]
> This file is designed to provide AI agents with immediate context about the project structure, technology stack, and development conventions. Read this first to understand how to navigate and modify the codebase.

## Project Overview
**Name**: Astro Learning Portal (astro-dev-id)
**Description**: An educational platform built with Astro, featuring course management, quizzes, and user progress tracking.
**Key Features**:
- Course & Chapter management
- Interactive Quizzes (Multiple Choice, Essay)
- User Authentication & Profiles
- Admin Dashboard

## Technology Stack
- **Framework**: [Astro](https://astro.build) (v4.x) - Server-side rendering (SSR) with Node.js adapter.
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (via Prisma ORM)
- **ORM**: Prisma
- **Authentication**: Auth.js (NextAuth) with Prisma Adapter
- **Deployment**: Node.js (Standalone mode)

## Project Structure

### Key Directories
- **`src/pages`**: File-based routing.
    - `api/`: API endpoints (JSON responses).
    - `admin/`: Admin dashboard routes.
    - `auth/`: Authentication routes (signin, signout).
    - `courses/`: Course listing and details.
    - `quizzes/`: Quiz interfaces.
- **`src/components`**: Reusable Astro components.
- **`src/layouts`**: Page layouts (e.g., `Layout.astro`, `CourseLayout.astro`).
- **`src/lib`**: Utility functions and shared logic.
- **`prisma`**: Database schema (`schema.prisma`) and migrations.
- **`public`**: Static assets.

### Data Model (Prisma)
Key models defined in `prisma/schema.prisma`:
- **User**: Students and Admins.
- **Course**: Educational courses.
- **Chapter**: Chapters within a course.
- **Quiz**: Quizzes linked to courses or chapters.
- **QuizAttempt**: User submissions and scores.
- **Profile**: Extended user information.

## Development Conventions

### Component Architecture
- Use **Astro components** (`.astro`) for most UI.
- Use **React/Preact** (if present) only for complex interactive islands (check `astro.config.mjs` integrations). *Currently seems to be pure Astro + Vanilla JS based on config.*
- **Styling**: Use Tailwind utility classes. Avoid custom CSS files unless necessary.

### Database Access
- Use `prisma` client for all database operations.
- **Do not** write raw SQL unless absolutely necessary.
- Run `npx prisma generate` after schema changes.
- Run `npx prisma db push` to update the local SQLite database.

### Authentication
- Protected routes should check for session existence using Auth.js helpers.
- User roles (`admin`, `student`) determine access levels.

## Common Commands
- `npm run dev`: Start development server.
- `npm run build`: Build for production.
- `npm run db:push`: Push schema changes to DB.
- `npm run db:studio`: Open Prisma Studio to view data.

## Best Practices for AI Agents
1.  **Check `schema.prisma`** first when dealing with data to understand relationships.
2.  **Respect File Structure**: Put new pages in `src/pages`, components in `src/components`.
3.  **Type Safety**: Always use TypeScript interfaces/types.
4.  **Tailwind**: Use standard Tailwind classes.
5.  **Routing**: Follow Astro's file-based routing patterns.
