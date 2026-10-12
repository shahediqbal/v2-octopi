# V2 Release Checklist

## Build

1. Run `npm run build:production`
2. Run `npm run build:staging`
3. Confirm `erptzbuild/` exists for production upload
4. Confirm `erpalgobuild/` exists for training upload

## API Targets

1. Production build must point to `https://api.tradezentrum.com/api`
2. Staging build must point to `https://api-v2.algologix.com.bd/api`
3. Do not upload the same built folder to both servers

## Upload

1. Upload `erptzbuild/` contents to `tradezentrum.com`
2. Upload `erpalgobuild/` contents to `erp.algologix.com.bd`
3. Keep SPA rewrite support enabled so routes fall back to `index.html`

## Smoke Test

1. Open the sign-in page on both servers
2. Confirm login works against the expected environment
3. Open one list page and one create/edit page
4. Confirm no API 401, 403, 404, or CORS errors in browser devtools
5. Confirm a hard refresh on a deep route still loads correctly