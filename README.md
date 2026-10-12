# Octopi V2

V2 ERP frontend built with React, TypeScript, and Vite.

## Safe Deployment Workflow

This project now follows the same safe pattern as the legacy app: build separate frontend bundles for production and staging/training.

- `npm run build:production`
  Creates `erptzbuild/` for `tradezentrum.com`
  Uses `https://api.tradezentrum.com/api`
- `npm run build:staging`
  Creates `erpalgobuild/` for `erp.algologix.com.bd`
  Uses `https://api-v2.algologix.com.bd/api`
- `npm run build:all`
  Creates both outputs in one run

## Environment Files

- `.env.production` -> production API and production mode
- `.env.staging` -> training/staging API and staging mode

The shared runtime env reader is in `src/config/env.ts` and all API calls flow through `src/lib/api.ts`.

## Local Development

- `npm run dev`
- `npm run test`
- `npm run lint`

## Deployment Notes

- Upload `erptzbuild/` to the live production server
- Upload `erpalgobuild/` to the training/staging server
- Do not reuse the same built folder across both servers because each build targets a different backend API
- The server must rewrite SPA routes to `index.html`
- Use `docs/release-checklist.md` for the final pre-upload checks
