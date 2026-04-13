# Choose

Mobile-first React + TypeScript app for helping groups decide together (polls first; more tools later).

## Local development

```bash
npm install
npm run dev
```

Optional: copy `.env.example` to `.env` and add Supabase keys when you connect realtime sync.

## Deploy the frontend on GitHub Pages

This repo is set up so production builds use a base path of `/<repository-name>/`, which matches GitHub Pages project sites (`https://<user>.github.io/<repo>/`).

1. Push this project to a GitHub repository.
2. **Settings → Pages → Build and deployment → Source:** GitHub Actions.
3. Push to `main`; the workflow [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml) builds and deploys.

Routing uses the **hash** (`#/`, `#/join`, `#/session/...`) so refreshes work on GitHub Pages without extra SPA redirects.

### Optional: bake Supabase keys into the Pages build

The anon key is intended to be public (protect data with Row Level Security in Supabase). To enable the “configured” UI in production:

- **Settings → Secrets and variables → Actions:** add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (repository secrets).  
  The workflow passes them into `npm run build`.

## Cheap backend options (realtime + persistence)

You need **something** beyond static hosting for shared votes: a database plus a way to push updates to all clients.

| Option | Why consider it | Typical cost |
|--------|-----------------|--------------|
| **[Supabase](https://supabase.com)** | Postgres, auth, and Realtime channels; fits the PRD; **you do not host a server** for the API | Generous **free** tier; paid when you outgrow it |
| **[Firebase](https://firebase.google.com)** (Firestore + Auth) | Similar managed stack; good if you prefer Google | Free tier, then usage-based |
| **[Cloudflare Workers](https://workers.cloudflare.com)** + Durable Objects / D1 | Very cheap at scale; more DIY | Often **free**–low for small traffic |
| **[Railway](https://railway.app)**, **[Render](https://render.com)**, **[Fly.io](https://fly.io)** | Run a small **Node** (or other) API + WebSockets if you want a custom server | Free tiers or ~$5/mo for light use |

**Practical default:** use **Supabase** for the “backend” — your React app on GitHub Pages talks to Supabase’s hosted API; you configure tables, RLS, and Realtime in the Supabase dashboard. No separate VM to babysit.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build (`VITE_BASE_PATH` optional for local GH Pages test) |
| `npm run preview` | Preview production build locally |
| `npm run deploy:gh-pages` | Publish `dist/` to `gh-pages` branch (optional; prefer the Actions workflow) |

## License

Private / unlicensed until you add one.
# choose-app
