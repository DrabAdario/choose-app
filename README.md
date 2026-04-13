# Choose

**Choose** is a mobile-first web app for groups who want to pick something together—where to eat, what to watch, or any short list of options—without endless group chat. You get a central hub, decision tools (starting with a **poll**), and room to add shared, realtime sync later so votes and choices stay in step for everyone in the session.

Stack: **React**, **TypeScript**, **Vite**, and **MUI**. Routes: hub (`#/`),
poll session (`#/session/:id`), wheel (`#/wheel/:id`), and join (`#/join`).
Connecting **Supabase** unlocks durable, multi-device sessions for poll and wheel.

## Development

```bash
npm install
cp .env.example .env
# Edit .env and add your Supabase URL and anon key (see table below).
npm run dev
```

### Environment variables

The repo includes **`.env.example`**. Copy it to **`.env`** and fill in values (`.env` is gitignored—never commit it):

| Variable | Where to find it |
|----------|------------------|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` *or* `VITE_SUPABASE_PUBLISHABLE_KEY` | Same page — legacy **anon** JWT, or the new **publishable** key (`sb_publishable_…`). Never use `service_role` in the client. |

Set **one** of the key variables (not both). The dashboard may show only **Publishable**; use `VITE_SUPABASE_PUBLISHABLE_KEY` for that value.

Do **not** add the Postgres password, `service_role` key, or `postgresql://…` URI to `.env` for this app—the React client does not use them.

For **GitHub Pages** builds, add `VITE_SUPABASE_URL` and **either** `VITE_SUPABASE_ANON_KEY` **or** `VITE_SUPABASE_PUBLISHABLE_KEY` as [repository secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions) (same names as above) so the [deploy workflow](.github/workflows/deploy-pages.yml) can inject them at build time.

If the app shows **“Invalid API key”**, the URL and key are not a matching pair for one project: re-copy **Project URL** and the **publishable** or **anon** key (not `service_role`) from Supabase → Project Settings → API, with no extra spaces or quotes. Update repository secrets and push again so CI rebuilds.

### Database schema

Apply the SQL in [`supabase/migrations/001_sessions.sql`](supabase/migrations/001_sessions.sql) once in the Supabase SQL Editor (or via the Supabase CLI). That creates the `sessions` table, RLS policies, and Realtime for shared polls.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run deploy:gh-pages` | Publish `dist/` to the `gh-pages` branch (optional) |

## Hosting

The included [GitHub Actions workflow](.github/workflows/deploy-pages.yml) can publish a production build to **GitHub Pages**. Builds use the base path `/<repository-name>/` for project URLs like `https://<user>.github.io/<repo>/`. The app uses **hash-based** routes (`#/`, `#/join`, `#/session/...`) so reloads work without extra SPA configuration.

To turn on Supabase in that build, use the same repository secrets as in [Environment variables](#environment-variables) above. The workflow passes them into `npm run build`.

## Backend and realtime

Shared votes need a database and a way to push updates to clients—not something static hosting alone provides.

| Option | Notes | Typical cost |
|--------|--------|--------------|
| [Supabase](https://supabase.com) | Postgres, auth, Realtime; no separate API server to run | Free tier, then paid |
| [Firebase](https://firebase.google.com) | Firestore + Auth | Free tier, then usage-based |
| [Cloudflare](https://workers.cloudflare.com) Workers + Durable Objects / D1 | Flexible, more DIY | Often free or low for small traffic |
| [Railway](https://railway.app), [Render](https://render.com), [Fly.io](https://fly.io) | Custom Node (or other) + WebSockets | Free tiers or low cost for light use |

A good default for this project is **Supabase**: configure tables, RLS, and Realtime in their dashboard; the React client talks to their hosted API.
