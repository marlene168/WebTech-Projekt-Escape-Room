// Welches Backend gehört zu welcher Adresse? Zuordnung über den Hostnamen der Seite.
//
// Das ist KEIN Zugriffsschutz: Es verhindert nur, dass eine Seite versehentlich mit dem falschen
// Backend arbeitet. Berechtigungen sichern RLS und die Edge Functions im Backend.
// Gespielt wird über die stabile Hauptadresse. Andere Adressen (z. B. einzelne Vercel-Deployments
// wie escape-room-test-abc123….vercel.app) haben bewusst kein Backend und sind nicht spielbar.
//
// Alle Werte hier sind öffentlich (Publishable Key, Turnstile Site Key). Geheime Schlüssel gibt es
// im Browser nie.

const UMGEBUNGEN = [
  {
    name: "lokal", // "npm run backend:start" – Standardwerte der Supabase CLI, ohne CAPTCHA
    hostnamen: ["localhost", "127.0.0.1"],
    url: "http://127.0.0.1:54321",
    schluessel: "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH",
    turnstile: null,
  },
  {
    name: "test", // geschützte Online-Testversion (Vercel Authentication, siehe docs/anleitung.md)
    hostnamen: ["escape-room-test-mauve.vercel.app"],
    url: "https://lfqcvevtzddxaywshxwg.supabase.co",
    schluessel: "sb_publishable_ZrSu7aZZMR-4RFaVoOwpiQ_eThDJL7A",
    turnstile: "0x4AAAAAAFhw9z0L0UM45dNf", // Gastanmeldung nur mit CAPTCHA, geprüft von Supabase
  },
  // Öffentliche Version: wird erst nach ausdrücklicher Freigabe ergänzt.
];

const umgebung = UMGEBUNGEN.find((eintrag) => eintrag.hostnamen.includes(location.hostname));

export const UMGEBUNG = umgebung?.name ?? null;
export const SUPABASE_URL = umgebung?.url ?? null;
export const SUPABASE_SCHLUESSEL = umgebung?.schluessel ?? null;
export const TURNSTILE_SITE_KEY = umgebung?.turnstile ?? null;
export const BACKEND_EINGERICHTET = Boolean(SUPABASE_URL && SUPABASE_SCHLUESSEL);
