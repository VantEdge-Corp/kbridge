#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is required but was not found in PATH." >&2
  exit 1
fi

if [ ! -f .env ]; then
  echo "Error: .env is missing." >&2
  echo "Copy .env.example to .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY." >&2
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

cat <<'EOF'

──────────────────────────────────────────────────────────────────────
  kbridge — Members' Society
──────────────────────────────────────────────────────────────────────

  Public routes
    /            Landing
    /apply       Submit an application
    /status/:t   Check your application status
    /login       Sign in (magic link or password)

  Admin
    /admin       Review queue (gated by profiles.is_admin)

  Bootstrap admin credentials (after running supabase/seed_admin.sql)
    email     : admin@admin.local
    password  : admin
    sign-in   : http://localhost:5173/login
                → "Sign in with password instead"

──────────────────────────────────────────────────────────────────────

EOF

exec npm run dev -- --host 0.0.0.0
