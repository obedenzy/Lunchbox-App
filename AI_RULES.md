# AI Rules & Project Guidelines

This document serves as a guide for any AI-assisted development on the BentoMagic project.

## Tech Stack
*   **Frontend**: React 19 with TypeScript for robust, type-safe development.
*   **Framework**: Next.js 15 (App Router) for server-side capabilities and routing.
*   **Styling**: Tailwind CSS for all UI styling, utilizing a utility-first approach.
*   **AI Engine**: Google Gemini AI (`@google/genai`) for structured JSON meal plan generation (Server-side API).
*   **Image Generation**: Runware API for hyper-realistic food photography (Server-side API).
*   **Payments**: Stripe Embedded Checkout for secure, on-page transactions.
*   **Iconography**: Lucide React for a consistent and modern icon set.
*   **Persistence**: LocalStorage for handling user sessions and history (Sync with state).

## Library & Implementation Rules

### 1. Styling & Layout
*   **Rule**: Use Tailwind CSS exclusively.
*   **Responsive**: All components must be mobile-first and fully responsive using Tailwind breakpoints.

### 2. UI Components
*   **Rule**: Prioritize small, modular components in the `components/` directory.
*   **Icons**: Use `lucide-react` or the established `Icons.tsx`.

### 3. Server-Side Logic (API Routes)
*   **Rule**: All sensitive operations (AI generation, Stripe session creation) MUST happen in `app/api/` routes to protect API keys.
*   **Environment Variables**: Use `process.env` in server-side routes. Client-side should only use `NEXT_PUBLIC_` if absolutely necessary (avoid for secrets).

### 4. Code Organization
*   **Components**: Keep components focused (ideally under 100 lines).
*   **Types**: Define all shared interfaces in `types.ts`.