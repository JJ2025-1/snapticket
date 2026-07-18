import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_url' && supabaseAnonKey !== 'your_key') {
  client = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn("Supabase credentials not found or are placeholders. Running in local fallback mode (using data.json).");

  // A mock thenable/chainable query builder
  const dummyChain = {
    select: () => dummyChain,
    order: () => dummyChain,
    eq: () => dummyChain,
    single: () => dummyChain,
    update: () => dummyChain,
    insert: () => dummyChain,
    delete: () => dummyChain,
    ilike: () => dummyChain,
    // Allows direct await of the chain or any method
    then: (resolve) => resolve({ data: null, error: { message: 'Supabase offline/not configured' } })
  };

  client = {
    from: () => dummyChain,
  };
}

export const supabase = client;

