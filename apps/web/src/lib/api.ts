import { createApi } from '@peaches/core';
import { supabase } from './supabase';

export const api = createApi(supabase);

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Something went wrong.';
}
