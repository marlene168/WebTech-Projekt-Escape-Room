// Tests für die Adresszuordnung im Browser (public/js/supabase-konfig.js). Ausführen mit: npm test
// Die Datei liest location.hostname – hier wird sie für jede Adresse frisch geladen.
import { test } from "node:test";
import assert from "node:assert/strict";

let zaehler = 0;
async function konfigFuer(hostname) {
  globalThis.location = { hostname };
  // Anhang ?n=… lädt das Modul neu, statt die zwischengespeicherte Fassung zu nehmen
  return import(`../public/js/supabase-konfig.js?n=${zaehler++}`);
}

test("Lokal: lokales Supabase ohne CAPTCHA", async () => {
  for (const hostname of ["localhost", "127.0.0.1"]) {
    const konfig = await konfigFuer(hostname);
    assert.equal(konfig.UMGEBUNG, "lokal");
    assert.equal(konfig.SUPABASE_URL, "http://127.0.0.1:54321");
    assert.equal(konfig.TURNSTILE_SITE_KEY, null);
  }
});

test("Test-Hauptadresse: Test-Projekt mit CAPTCHA", async () => {
  const konfig = await konfigFuer("escape-room-test-mauve.vercel.app");
  assert.equal(konfig.UMGEBUNG, "test");
  assert.equal(konfig.SUPABASE_URL, "https://lfqcvevtzddxaywshxwg.supabase.co");
  assert.match(konfig.SUPABASE_SCHLUESSEL, /^sb_publishable_/);
  assert.ok(konfig.TURNSTILE_SITE_KEY);
});

test("Andere Adressen (z. B. einzelne Deployments) bekommen kein Backend", async () => {
  for (const hostname of ["escape-room-test-abc123-web-tech-escape-room.vercel.app", "example.com"]) {
    const konfig = await konfigFuer(hostname);
    assert.equal(konfig.BACKEND_EINGERICHTET, false, hostname);
    assert.equal(konfig.SUPABASE_URL, null);
  }
});

test("Im Browser stehen keine geheimen Supabase-Schlüssel", async () => {
  const { readFileSync } = await import("node:fs");
  const inhalt = readFileSync("public/js/supabase-konfig.js", "utf8");
  assert.ok(!/sb_secret_|service_role/i.test(inhalt));
});
