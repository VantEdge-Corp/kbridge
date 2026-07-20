import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Vite inlines these at BUILD time, so on a hosted deploy they come from the
// host's environment variables (Vercel → Settings → Environment Variables),
// not from the local .env. Getting this wrong produces a bare "Failed to
// fetch" at sign-in, which looks like a backend outage rather than a config
// problem — so fail loudly and specifically instead.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase config. Locally: copy .env.example to .env and set " +
    "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart `npm run dev`. " +
    "On a deploy: set both in the host's environment variables and redeploy — " +
    "changing them requires a rebuild, since Vite bakes them into the bundle.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
