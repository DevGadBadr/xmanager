<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Live Environment Notes

### Production server
- Public URL: `https://flow.devgadbadr.com`
- PM2 app: `xmanager-3008`
- Runtime: `next start -p 3008`
- `NODE_ENV=production`
- `APP_ENV=production`
- `APP_BASE_PATH=` empty string
- `NEXT_PUBLIC_APP_BASE_PATH=` empty string
- Canonical auth URL: `https://flow.devgadbadr.com/api/auth`
- Canonical app URL: `https://flow.devgadbadr.com`
- Reverse proxy: Nginx proxies `/` to `http://localhost:3008`

### Development server
- Public URL: `https://devgadbadr.com/flow`
- PM2 app: `xmanager-dev-3018`
- Runtime: `next dev -p 3018 --hostname 127.0.0.1`
- `NODE_ENV=development`
- `APP_ENV=development`
- `APP_BASE_PATH=/flow`
- `NEXT_PUBLIC_APP_BASE_PATH=/flow`
- Canonical auth URL: `https://devgadbadr.com/flow/api/auth`
- Canonical app URL: `https://devgadbadr.com/flow`
- Reverse proxy: Nginx keeps the `/flow` prefix intact and proxies to `http://127.0.0.1:3018`
- TLS: Let's Encrypt cert at `/etc/letsencrypt/live/flow.devgadbadr.com/`
- Basic auth is enabled at Nginx for the dev app route
  - Username: `xmanagerdev`
  - Password: `Cial8YnyXl8YRCiX+jJCnBq/4WHMSJty`

### Current env files
- Production local env reference: `/root/Gad/web/Apps/xmanager/.env`
- Development local env reference: `/root/Gad/web/Apps/xmanager/.env.development`
- PM2 config: `/root/Gad/web/Apps/xmanager/ecosystem.config.cjs`

### Important app behavior
- The app is environment-aware through `lib/auth-path.ts` and `next.config.ts`.
- Production must run at the host root with no base path.
- Development must keep the `/flow` base path.
- `next.config.ts` uses `allowedDevOrigins: ["devgadbadr.com"]` for dev.
- Auth URLs and generated links must stay environment-specific.
- Current prod and dev use the same database and Google OAuth credentials unless changed later.

### Nginx notes
- Live prod Nginx config is outside the repo at `/etc/nginx/sites-available/devgadbadr.com`
- Live dev HTTPS Nginx config is currently in `/etc/nginx/sites-available/default`
- Repo reference template for prod host: `/root/Gad/web/Apps/xmanager/infra/nginx/flow.devgadbadr.com.conf`

### Operational cautions
- Do not remove the dev `/flow` base-path behavior unless explicitly requested.
- Do not expose the dev route without Basic Auth or an equivalent restriction.
- If changing dev-route auth or proxying, test both HMR/dev assets and Google auth callback generation.
- When debugging auth issues, check both `.env.development` and the PM2 process env.
