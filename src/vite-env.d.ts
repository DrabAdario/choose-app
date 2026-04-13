/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  /** Legacy JWT; use this or `VITE_SUPABASE_PUBLISHABLE_KEY`. */
  readonly VITE_SUPABASE_ANON_KEY?: string
  /** New dashboard “publishable” key (`sb_publishable_…`). */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  readonly VITE_BASE_PATH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
