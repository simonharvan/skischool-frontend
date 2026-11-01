# Ski school backoffice

Admin app of the ski school: lessons timeline, attendance, instructors, payouts, clients and stats.

Vue 3 + Vite + TypeScript, Pinia, Vue Router, vue-i18n (SK/EN), Element Plus + Tailwind, ECharts.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm run lint
npm test
npm run build      # type-check + production build into dist/
```

The API base URL comes from `VITE_API_BASE_URL`:

| file | value |
| --- | --- |
| `.env.development` | `http://backend.test/api/admin` |
| `.env.production` | `https://api.skischool.bero.tech/api/admin` |

To point the dev server somewhere else without touching the repo, create `.env.development.local` (git-ignored).

## Structure

- `src/api` – one typed module per backend resource, `http.ts` is the axios client (token, 401 handling, error toasts)
- `src/components/timeline` – the generic day timeline (`DayTimeline.vue`) and its pure, unit-tested helpers (`geometry.ts`)
- `src/config/pricing.ts` – price list and instructor payout rate
- `src/i18n` – `sk.ts` is the source of truth, `en.ts` is typed against it
- `src/utils/date.ts` – the backend expects local wall-clock `YYYY-MM-DD HH:mm:ss`; always go through these helpers

## Deploy (https://office.skimedved.sk)

### Automatically

Every push to `master` runs `.github/workflows/deploy.yml`, which lints, tests, builds and uploads `dist/` over FTP(S).
Add these repository secrets (Settings → Secrets and variables → Actions):

- `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` – FTP access of the hosting
- `FTP_DIR` – remote folder of the `office.skimedved.sk` subdomain, ending with `/`

### By hand

```bash
npm run build
```

Upload **the contents** of `dist/` to the web root of the subdomain with any FTP client. Make sure the hidden
`.htaccess` is uploaded too – without it, reloading a page other than `/` returns 404.
