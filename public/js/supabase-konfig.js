// Adresse und öffentlicher Schlüssel des Supabase-Backends.
// Beide Werte dürfen im Browser stehen: Was erlaubt ist, entscheiden die Zugriffsregeln (RLS)
// und die Edge Functions. Den geheimen Schlüssel (Secret Key) gibt es im Browser nie.

// Lokales Supabase aus "npm run backend:start" (Standardwerte der Supabase CLI)
const LOKAL = {
  url: "http://127.0.0.1:54321",
  schluessel: "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH",
};

// Cloud-Projekt – wird in AP 5 eingetragen
const CLOUD = {
  url: null,
  schluessel: null,
};

const istLokal = ["localhost", "127.0.0.1"].includes(location.hostname);

export const { url: SUPABASE_URL, schluessel: SUPABASE_SCHLUESSEL } = istLokal ? LOKAL : CLOUD;
export const BACKEND_EINGERICHTET = Boolean(SUPABASE_URL && SUPABASE_SCHLUESSEL);
