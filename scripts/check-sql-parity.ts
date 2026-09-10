/**
 * Confirms that the SQL preference functions in migration 013 (pref_compatibility,
 * pref_eligible) agree with the TypeScript implementation in @peaches/core for
 * every (preferences owner, candidate) pair in a database. Run against a local
 * stack with seed data:
 *
 *   SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=... \
 *   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres npm run check:parity
 */
import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import {
  PUBLIC_PROFILE_COLUMNS,
  compatibility,
  eligible,
  toPreferences,
  toPublicProfile,
  type PublicProfileRow,
} from '@peaches/core';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const db = process.env.DATABASE_URL;
if (!url || !key || !db) {
  console.error('Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and DATABASE_URL.');
  process.exit(2);
}

const sql = `copy (
  select b.user_id, a.id, public.pref_compatibility(b.prefs, a), public.pref_eligible(b.prefs, a)
  from public.profiles a cross join public.member_preferences b
  where a.onboarding_complete and a.id <> b.user_id
) to stdout with csv`;
const csv = execFileSync('psql', [db, '-Atc', sql], { encoding: 'utf8' }).trim();
const pairs = csv
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    const [owner, candidate, compat, elig] = line.split(',');
    return { owner: owner ?? '', candidate: candidate ?? '', compat: Number(compat), elig: elig === 't' };
  });

const client = createClient(url, key);
const profileRows = await client.from('public_profiles').select(PUBLIC_PROFILE_COLUMNS);
if (profileRows.error) throw profileRows.error;
const profiles = new Map((profileRows.data as PublicProfileRow[]).map((r) => [r.id, toPublicProfile(client, r)]));
const prefRows = await client.from('member_preferences').select('user_id, prefs');
if (prefRows.error) throw prefRows.error;
const prefs = new Map((prefRows.data as Array<{ user_id: string; prefs: unknown }>).map((r) => [r.user_id, toPreferences(r.prefs)]));

let checked = 0;
let mismatches = 0;
for (const pair of pairs) {
  const profile = profiles.get(pair.candidate);
  const owner = profiles.get(pair.owner);
  const pref = prefs.get(pair.owner);
  if (!profile || !owner || !pref) continue;
  checked += 1;
  const ts = compatibility(pref, profile);
  const tsEligible = eligible(
    { profile: owner, preferences: pref, maxDistanceMiles: Number.MAX_SAFE_INTEGER },
    {
      profile,
      signals: {
        profileId: profile.id,
        distanceMiles: 0,
        demandBucket: 0,
        exposureBucket: 0,
        lastActiveAt: '',
        createdAt: '',
        reverseCompatibility: 0.5,
        reverseEligible: true,
      },
    },
  );
  if (Math.abs(ts - pair.compat) > 0.001 || tsEligible !== pair.elig) {
    mismatches += 1;
    if (mismatches <= 10) console.log('mismatch', { ...pair, ts, tsEligible });
  }
}
console.log(`SQL/TS parity: ${checked} pairs checked, ${mismatches} mismatches`);
process.exit(mismatches === 0 ? 0 : 1);
