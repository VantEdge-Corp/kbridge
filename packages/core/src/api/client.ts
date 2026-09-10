import type { SupabaseClient } from '@supabase/supabase-js';

/** The apps create the client (env handling differs per platform) and hand it to createApi(). */
export type Client = SupabaseClient;

export class ApiError extends Error {
  code: string | null;
  constructor(message: string, code: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

interface PostgrestLikeError {
  message: string;
  code?: string;
  details?: string;
}

/**
 * Throws a readable ApiError for a failed PostgREST/Supabase call. The client is
 * untyped (column lists are plain strings), so callers cast the result to the
 * row shape they selected.
 */
export function unwrap<T = unknown>(result: { data: unknown; error: PostgrestLikeError | null }): T {
  if (result.error) throw new ApiError(friendlyMessage(result.error), result.error.code ?? null);
  return result.data as T;
}

export function unwrapMaybe<T = unknown>(result: { data: unknown; error: PostgrestLikeError | null }): T | null {
  if (result.error) {
    if (result.error.code === 'PGRST116') return null; // .single() with zero rows
    throw new ApiError(friendlyMessage(result.error), result.error.code ?? null);
  }
  return (result.data ?? null) as T | null;
}

function friendlyMessage(error: PostgrestLikeError): string {
  if (error.code === '23505') return 'That already exists.';
  return error.message || 'Something went wrong.';
}

export function isUniqueViolation(error: unknown): boolean {
  return error instanceof ApiError && error.code === '23505';
}

/**
 * True when a query failed because the database is missing a table, column or
 * function the app expects, which almost always means a migration has not been
 * run on this Supabase project yet.
 */
export function isSchemaOutOfDate(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  if (error.code === '42703' || error.code === '42P01' || error.code === '42883' || error.code === 'PGRST205' || error.code === 'PGRST202') return true;
  return /does not exist|schema cache/i.test(error.message);
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === 'string' ? error : 'Something went wrong.';
}

let channelCounter = 0;
export function uniqueChannelName(prefix: string): string {
  channelCounter += 1;
  return `${prefix}:${Date.now().toString(36)}:${channelCounter}`;
}

export function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
