# Choose

**Choose** is a mobile-first web app for groups who want to pick something together—where to eat, what to watch, or any short list of options—without endless group chat. You get a central hub, decision tools (starting with a **poll**), and room to add shared, realtime sync later so votes and choices stay in step for everyone in the session.

Stack: **React**, **TypeScript**, and **Vite**. The UI works without a backend today; connecting **Supabase** (or similar) unlocks durable, multi-device sessions.

## Development

```bash
npm install
npm run dev
```

Optional: copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` when you wire up sync.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run deploy:gh-pages` | Publish `dist/` to the `gh-pages` branch (optional) |

## Hosting

The included [GitHub Actions workflow](.github/workflows/deploy-pages.yml) can publish a production build to **GitHub Pages**. Builds use the base path `/<repository-name>/` for project URLs like `https://<user>.github.io/<repo>/`. The app uses **hash-based** routes (`#/`, `#/join`, `#/session/...`) so reloads work without extra SPA configuration.

To turn on Supabase in that build, add repository secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the anon key is public by design; protect data with Row Level Security in Supabase). The workflow passes them into `npm run build`.

## Backend and realtime

Shared votes need a database and a way to push updates to clients—not something static hosting alone provides.

| Option | Notes | Typical cost |
|--------|--------|--------------|
| [Supabase](https://supabase.com) | Postgres, auth, Realtime; no separate API server to run | Free tier, then paid |
| [Firebase](https://firebase.google.com) | Firestore + Auth | Free tier, then usage-based |
| [Cloudflare](https://workers.cloudflare.com) Workers + Durable Objects / D1 | Flexible, more DIY | Often free or low for small traffic |
| [Railway](https://railway.app), [Render](https://render.com), [Fly.io](https://fly.io) | Custom Node (or other) + WebSockets | Free tiers or low cost for light use |

A good default for this project is **Supabase**: configure tables, RLS, and Realtime in their dashboard; the React client talks to their hosted API.
