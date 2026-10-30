import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://zebksrihswwwlejdiboq.supabase.co";
// Expo only inlines EXPO_PUBLIC_ variables when referenced directly like this.
// Trim and strip quotes: a pasted value with stray whitespace or quotes is inlined verbatim at build time.
const SUPABASE_PUBLISHABLE_KEY = (process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '')
  .trim()
  .replace(/^["']+|["']+$/g, '')
  .trim();

// Mobile bundles are public: only a publishable key (sb_publishable_...) may be used here.
if (!/^sb_publishable_[A-Za-z0-9_-]{10,}$/.test(SUPABASE_PUBLISHABLE_KEY)) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set to a Supabase publishable key (sb_publishable_...).'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);