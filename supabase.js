import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://zebksrihswwwlejdiboq.supabase.co";
// Expo only inlines EXPO_PUBLIC_ variables when referenced directly like this.
const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Mobile bundles are public: only a publishable key (sb_publishable_...) may be used here.
if (!SUPABASE_PUBLISHABLE_KEY || !SUPABASE_PUBLISHABLE_KEY.startsWith('sb_publishable_')) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set to a Supabase publishable key (sb_publishable_...).'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);