# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SafeGuard is a React-based safety application built with Vite, TypeScript, and shadcn/ui components. It provides emergency features including SOS functionality, incident reporting, safety timers, live location sharing, and fake call capabilities. The app uses Supabase for authentication and database management.

## Development Commands

**Start development server:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
```

**Build for development environment:**
```bash
npm run build:dev
```

**Lint code:**
```bash
npm run lint
```

**Preview production build:**
```bash
npm run preview
```

## Project Architecture

### Core Structure
- **Frontend Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **UI Library:** shadcn/ui (Radix UI primitives with Tailwind CSS)
- **Routing:** React Router DOM
- **State Management:** React Context for authentication, React Query for server state
- **Database:** Supabase with PostgreSQL
- **Authentication:** Supabase Auth with role-based access control

### Key Directories
- `src/pages/` - Main application pages (Index, Auth, SafetyTimer, IncidentReport, LiveLocation, FakeCall)
- `src/components/` - Reusable React components including specialized safety features
- `src/components/ui/` - shadcn/ui component library
- `src/contexts/` - React contexts (AuthContext for user authentication and admin status)
- `src/integrations/supabase/` - Supabase client configuration and type definitions
- `src/lib/` - Utility functions and shared logic
- `supabase/` - Database migrations and serverless functions

### Authentication & Authorization
- Uses Supabase Auth with session persistence
- Role-based access control with admin detection via `user_roles` table
- AuthContext provides: `user`, `session`, `isLoading`, `signOut`, `isAdmin`
- Protected routes redirect unauthenticated users to `/auth`
- Admin users have access to AdminPanel component

### Key Components
- **SosButton** - Emergency SOS functionality
- **QuickActions** - Quick access to safety features
- **ChatOverlay** - Emergency communication interface
- **EmergencyContactsModal** - Emergency contact management
- **BottomNav** - Main navigation component
- **AdminPanel** - Administrative interface (admin users only)

### Routing Structure
- `/` - Main dashboard (Index page)
- `/auth` - Authentication page
- `/safety-timer` - Safety timer functionality
- `/incident-report` - Incident reporting interface
- `/live-location` - Live location sharing
- `/fake-call` - Fake call feature for emergency situations

### Environment Configuration
Required environment variables in `.env`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon public key
- `VITE_SUPABASE_PROJECT_ID` - Supabase project identifier

### Database Schema
- Uses Supabase with custom `user_roles` table for role management
- Database types are auto-generated in `src/integrations/supabase/types.ts`
- Migrations stored in `supabase/migrations/`

### Styling & Design
- Tailwind CSS for styling with custom theme configuration
- Gradient backgrounds and glassmorphism effects
- Mobile-first responsive design
- Dark/light theme support via next-themes
- Custom color scheme with primary, secondary, and accent colors

### Development Notes
- TypeScript strict mode enabled
- ESLint configured with React and TypeScript rules
- Uses React Hook Form with Zod validation for forms
- Lucide React for iconography
- Date manipulation with date-fns
- Toast notifications via Sonner
- Component composition patterns following shadcn/ui conventions