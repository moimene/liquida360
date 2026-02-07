# LIQUIDA360 - Project Intelligence

## Project Overview
**LIQUIDA360** is a payment liquidation platform for law firms that manages correspondent payments, tax residency certificate lifecycle, and financial department request workflows.

## Active Skills
- **concise-planning**: For breaking down features into atomic action items
- **kaizen**: Continuous improvement, error-proofing, standardized work
- **lint-and-validate**: Mandatory validation after every code change
- **systematic-debugging**: Root cause analysis before any fix
- **git-pushing**: Conventional commits via smart_commit.sh
- **desarrollar-ux-garrigues**: UX governance - tokens only, no hex in components, WCAG AA mandatory

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui (following Garrigues Design System)
- **State**: Zustand
- **Backend**: Supabase (Auth, Database, Edge Functions, Realtime)
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **Tables**: TanStack Table
- **Notifications**: Sonner (toasts)
- **Date handling**: date-fns

## Design System Compliance
- ALL colors via CSS custom properties (--g-* tokens). NO hex in components.
- Typography: Montserrat (400, 500, 700)
- Spacing: 4px grid system
- WCAG AA accessibility mandatory (4.5:1 contrast minimum)
- Follow `ux_garrigues_promptmaestro.md` governance rules

## Architecture Principles
- Domain-driven structure: features grouped by business domain
- Supabase as single backend (auth, db, edge functions, storage)
- Row-Level Security (RLS) on all tables
- Optimistic UI updates with Zustand
- Edge Functions for business logic (payment requests, certificate checks)

## Code Conventions
- File naming: kebab-case for files, PascalCase for components
- Barrel exports via index.ts per feature module
- Zod schemas colocated with forms
- Database types auto-generated from Supabase
- No `any` types allowed
- Error boundaries at route level

## Key Business Rules
- Payments are NOT integrated with ERP (requests go to Financial Dept)
- Tax residency certificates have expiry tracking with pre-alerts
- Certificate validity period is configurable (default: 1 year)
- Pre-alert notifications at configurable intervals before expiry
- All payment requests require approval workflow
- Correspondent data includes country of origin for certificate lookup
