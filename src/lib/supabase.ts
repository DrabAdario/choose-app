import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** Trim and strip accidental quotes from pasted env (common in GitHub Secrets / .env). */
function cleanEnv(value: string | undefined): string {
  if (value === undefined || value === '') return ''
  let s = value.trim()
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim()
  }
  return s
}

const url = cleanEnv(import.meta.env.VITE_SUPABASE_URL)
/** Legacy JWT anon key, or new publishable key from the dashboard (`sb_publishable_…`). */
const apiKey = cleanEnv(
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)

export const isSupabaseConfigured = Boolean(url && apiKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, apiKey)
  : null
