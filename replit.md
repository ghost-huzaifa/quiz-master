# QuizMaster - Modern Quiz Management Platform

## Overview

QuizMaster is a comprehensive educational platform for creating, managing, and taking quizzes. Built with a modern full-stack architecture, it features role-based access control (teachers and students), real-time quiz taking with timers, comprehensive analytics, and a clean, Google-inspired UI design. The platform enables teachers to create engaging quizzes with multiple-choice questions while providing students with an intuitive interface for taking assessments and viewing their progress.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing without React Router overhead
- **UI Components**: shadcn/ui component library built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with custom CSS variables for theming and Google-inspired design system
- **State Management**: TanStack Query (React Query) for server state management, caching, and synchronization
- **Build Tool**: Vite for fast development and optimized production builds
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for REST API development
- **Language**: TypeScript with ES modules for consistent typing across the stack
- **Authentication**: Replit Auth integration with OpenID Connect for secure user authentication
- **Session Management**: Express sessions with PostgreSQL storage using connect-pg-simple
- **API Design**: RESTful endpoints with role-based authorization middleware
- **Error Handling**: Centralized error handling with proper HTTP status codes and JSON responses

### Database Architecture
- **Database**: PostgreSQL with standard pg driver for local container-based database management
- **ORM**: Drizzle ORM for type-safe database queries and schema management
- **Schema Design**: Relational schema with users, quizzes, questions, quiz_attempts, and sessions tables
- **Migrations**: Database migrations managed through Drizzle Kit for version control
- **Data Validation**: Zod schemas for runtime type validation and database constraints

### Authentication & Authorization
- **Provider**: Replit Auth with OpenID Connect protocol for secure authentication
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL (7 days default)
- **Role-Based Access**: Teacher and student roles with different permissions and UI experiences
- **Security**: HTTP-only cookies, CSRF protection, and secure session configuration

### File Structure & Organization
- **Monorepo Structure**: Shared TypeScript types and schemas in `/shared` directory
- **Client Directory**: React application with organized components, pages, hooks, and utilities
- **Server Directory**: Express API with modular route handlers, database layer, and authentication
- **Build Process**: Separate client and server builds with Vite for frontend and esbuild for backend

## External Dependencies

### Database & Infrastructure
- **PostgreSQL Container**: Local PostgreSQL database running in a container with standard pg driver
- **Environment Variables**: DATABASE_URL for database connection, SESSION_SECRET for session security

### Authentication Services
- **Replit Auth**: OpenID Connect provider for user authentication and authorization
- **Required Environment Variables**: REPLIT_DOMAINS, ISSUER_URL, REPL_ID for auth configuration

### UI & Design System
- **Radix UI**: Accessible component primitives for dialogs, dropdowns, forms, and navigation
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Consistent icon library for UI elements
- **Google Fonts Integration**: Typography system aligned with Google design principles

### Development & Build Tools
- **Vite Plugins**: Runtime error overlay and Replit-specific development tooling
- **TypeScript**: Full-stack type safety with shared schemas and strict compilation
- **PostCSS**: CSS processing with Tailwind and Autoprefixer plugins

### Additional Libraries
- **Date Handling**: date-fns for quiz timing and scheduling functionality
- **Utility Libraries**: clsx for conditional styling, memoizee for performance optimization
- **Validation**: Zod for runtime type checking and schema validation across client and server