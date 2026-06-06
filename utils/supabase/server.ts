// utils/supabase/server.ts
// Server-side Supabase client. Alle databasetoegang loopt via de server
// (achter de inlogcode). We gebruiken bij voorkeur de geheime service_role-
// sleutel, zodat de database GEEN publieke toegang meer nodig heeft.
// Valt terug op de anon-sleutel zolang de service-key nog niet is ingesteld,
// zodat de app blijft werken tijdens de overgang.
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const createClient = async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};
