import { createApi } from '@peaches/core';
import { supabase } from './supabase';

/** The whole data layer, bound to this app's Supabase client. */
export const api = createApi(supabase);
