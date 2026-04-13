import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** GitHub Pages project URL is /<repo-name>/; local dev uses '/'. */
function viteBase(): string {
  const p = process.env.VITE_BASE_PATH
  if (!p || p === '/') return '/'
  const withLeading = p.startsWith('/') ? p : `/${p}`
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: viteBase(),
})
