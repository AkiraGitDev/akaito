const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[env] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY ausentes. Copie .env.example para .env e preencha.',
  );
}

export const env = {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  USER_ID_ME: process.env.EXPO_PUBLIC_USER_ID_ME ?? '',
  USER_ID_HER: process.env.EXPO_PUBLIC_USER_ID_HER ?? '',
  COUPLE_STARTED_AT: '2025-01-17',
};
