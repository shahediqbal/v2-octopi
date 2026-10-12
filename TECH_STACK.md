# v2-octopi Tech Stack

## Core Framework & Language

| Tool | Version | Notes |
|---|---|---|
| **React** | `^19.2.0` | |
| **TypeScript** | `~5.9.3` | Strict mode, `verbatimModuleSyntax`, `noUnusedLocals/Parameters` |

---

## Build & Dev Tooling

| Tool | Version | Notes |
|---|---|---|
| **Vite** | `^7.3.1` | Dev server on port 3001 |
| `@vitejs/plugin-react` | `^5.1.1` | React Vite plugin |
| `@tailwindcss/vite` | `^4.2.1` | Tailwind injected as Vite plugin (not PostCSS) |
| `@types/node` | `^24.10.1` | Node types for `path.resolve` in vite config |
| Path alias `@/` | — | Maps to `./src/` (tsconfig + vite.config) |
| Dev proxy `/api` | — | Proxied to `https://api-v2.algologix.com.bd` |

---

## Styling

| Tool | Version | Notes |
|---|---|---|
| **Tailwind CSS** | `^4.2.1` | v4 — no `tailwind.config.js`, runs as Vite plugin |
| `clsx` | `^2.1.1` | Conditional class names |
| `tailwind-merge` | `^3.5.0` | Merge conflicting Tailwind classes |
| `class-variance-authority` | `^0.7.1` | Variant-based component styling (CVA) |
| Color convention | — | `gray-*` palette only — no `slate`, `blue`, or `indigo` |

---

## State Management

| Tool | Version | Role |
|---|---|---|
| **TanStack Query** | `^5.90.21` | Server/async state (queries + mutations) |
| `@tanstack/react-query-devtools` | `^5.91.3` | Dev tools panel |
| **Zustand** | `^5.0.11` | Client/UI state (`uiStore`, `toastStore`, `pinnedMenuStore`) |

---

## Routing

| Tool | Version | Notes |
|---|---|---|
| **React Router DOM** | `^7.13.1` | All routes in `router/AppRouter.tsx`; `ProtectedRoute` component |

---

## Forms & Validation

| Tool | Version | Notes |
|---|---|---|
| **React Hook Form** | `^7.71.2` | Form state management |
| **Zod** | `^4.3.6` | Schema validation |
| `@hookform/resolvers` | `^5.2.2` | Bridge between RHF and Zod |

---

## HTTP / API

| Tool | Version | Notes |
|---|---|---|
| **axios** | `^1.13.5` | Installed but not used directly |
| `lib/api.ts` | — | Typed fetch wrapper (preferred over raw axios); throws `ApiError` on non-2xx |
| Auth | — | JWT from `localStorage.userInfo` via `auth/authBridge.ts`; auto-injected as Bearer token |

---

## Icons & UI Utilities

| Tool | Version |
|---|---|
| **Lucide React** | `^0.575.0` |
| `react-barcode` | `^1.6.1` |

---

## Excel Export

| Tool | Version | Notes |
|---|---|---|
| **ExcelJS** | `^4.4.0` | Lazy-loaded via dynamic import; reusable util at `utils/exportExcel.ts` |

---

## Authentication

| Tool | Version | Notes |
|---|---|---|
| `jwt-decode` | `^4.0.0` | Decode JWT from `localStorage` |

---

## Testing

| Tool | Version | Notes |
|---|---|---|
| **Vitest** | `^4.1.0` | Test runner; `jsdom` environment; config in `vite.config.ts` |
| `@testing-library/react` | `^16.3.2` | Component testing |
| `@testing-library/jest-dom` | `^6.9.1` | DOM matchers |
| `jsdom` | `^29.0.1` | Browser environment simulation |
| Setup file | — | `src/test/setup.ts` |

---

## Linting

| Tool | Version | Notes |
|---|---|---|
| **ESLint** | `^9.39.1` | Flat config (`eslint.config.js`) |
| `typescript-eslint` | `^8.48.0` | TypeScript-aware rules |
| `eslint-plugin-react-hooks` | `^7.0.1` | Hooks rules |
| `eslint-plugin-react-refresh` | `^0.4.24` | HMR safety |
| `globals` | `^16.5.0` | Browser globals for ESLint |

---

## Architecture & Notable Patterns

- **Feature-based structure:** `src/features/` (quotation, stock-in, stock-out), `src/pages/`, `src/hooks/` (one file per domain)
- **Centralized dropdown system:** 22 dropdown types — `DropdownSelect` (≤100 records, native `<select>`) and `PaginatedCombobox` (infinite scroll)
- **API client:** `lib/api.ts` typed fetch wrapper; not raw axios
- **QueryClient config:** centralized in `lib/queryClient.ts`
- **`cn()` helper:** `clsx` + `tailwind-merge` in `lib/utils.ts`
- **No PostCSS** — Tailwind v4 runs entirely as a Vite plugin
- **ESM throughout** — `"type": "module"` in package.json
