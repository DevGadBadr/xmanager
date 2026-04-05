## Getting Started

Run the local development server:

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Environment Model

XManager supports two deployment shapes:

- Production: `https://xmanager.devgadbadr.com`
- Development HTTPS route: `https://devgadbadr.com/xmanager`

The deployment shape is driven by these env vars:

- `APP_ENV=production|development`
- `APP_BASE_PATH` empty in production and `/xmanager` in development
- `NEXT_PUBLIC_APP_ENV` and `NEXT_PUBLIC_APP_BASE_PATH` for client-side routing/auth helpers
- `APP_URL`, `AUTH_URL`, and `NEXTAUTH_URL` set to the canonical origin for the active environment

Use `.env.example` as the template for local or server env files.

## PM2 Targets

- `xmanager-3008`: production `next start` on port `3008`
- `xmanager-dev-3018`: development `next dev` on port `3018`

Production deploy remains:

```bash
./scripts/deploy.sh
```

Dev HTTPS host process:

```bash
pm2 startOrRestart ecosystem.config.cjs --only xmanager-dev-3018
pm2 save
```

## HTTPS Routing

The Nginx template for the production host lives at
[`infra/nginx/xmanager.devgadbadr.com.conf`](/root/Gad/web/Apps/xmanager/infra/nginx/xmanager.devgadbadr.com.conf).

Google OAuth must include:

- Authorized JavaScript origin: `https://xmanager.devgadbadr.com`
- Authorized redirect URI: `https://xmanager.devgadbadr.com/api/auth/callback/google`
- Authorized JavaScript origin: `https://devgadbadr.com`
- Authorized redirect URI: `https://devgadbadr.com/xmanager/api/auth/callback/google`
