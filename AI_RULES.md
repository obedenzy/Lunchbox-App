# AI Rules & Project Guidelines

This document serves as a guide for any AI-assisted development on the BentoMagic project.

## Tech Stack
*   **Frontend**: React 19 with TypeScript for robust, type-safe development.
*   **Build Tool**: Vite for fast development and optimized production builds.
*   **Styling**: Tailwind CSS for all UI styling, utilizing a utility-first approach.
*   **AI Engine**: Google Gemini AI (`@google/genai`) for structured JSON meal plan generation.
*   **Image Generation**: Runware API for hyper-realistic food photography.
*   **Iconography**: Lucide React for a consistent and modern icon set.
*   **UI Components**: Shadcn/UI (Radix UI) for accessible, high-quality interface elements.
*   **Persistence**: LocalStorage for handling user sessions, tokens, and meal history.

## Library & Implementation Rules

### 1. Styling & Layout
*   **Rule**: Use Tailwind CSS exclusively. Do not create new CSS files or use inline styles unless for dynamic values (e.g., `conic-gradient`).
*   **Responsive**: All components must be mobile-first and fully responsive using Tailwind breakpoints (`sm:`, `md:`, `lg:`, `xl:`).

### 2. UI Components
*   **Rule**: Prioritize `shadcn/ui` components for all common UI patterns (Buttons, Inputs, Dialogs, Tabs).
*   **Icons**: Use `lucide-react`. Avoid adding custom SVG components unless the icon is highly specific (like a custom logo).

### 3. State & Data
*   **Rule**: Use React Hooks (`useState`, `useMemo`, `useEffect`) for local state.
*   **Persistence**: Any data intended to survive a page refresh (User, Tokens, History) must be synced with `localStorage`.

### 4. AI & External Services
*   **AI Model**: Use `gemini-3-pro-preview` for complex JSON generations. Always provide a clear `responseSchema` to ensure valid output.
*   **Images**: All image generation should pass through the `runwareService.ts` to maintain consistent prompts and error handling.

### 5. Routing
*   **Rule**: Maintain routing logic within `App.tsx`. Use the established `View` type system for switching between pages (Home, History, Profile, etc.) unless `react-router-dom` is explicitly integrated.

### 6. Code Organization
*   **Components**: Keep components focused and small (ideally under 100 lines). Break large files into smaller pieces in the `src/components/` directory.
*   **Types**: Define all shared interfaces and types in `src/types.ts`.