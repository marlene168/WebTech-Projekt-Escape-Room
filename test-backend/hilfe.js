// Hilfsfunktionen für die Backend-Tests. Sie laufen ausschließlich gegen das LOKALE Supabase
// (gestartet mit "npm run backend:start"), niemals gegen das Cloud-Projekt.
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Adresse und Schlüssel des lokalen Supabase aus "supabase status" lesen
const status = Object.fromEntries(
  execFileSync("npx", ["supabase", "status", "-o", "env"], { encoding: "utf8" })
    .split("\n")
    .filter((zeile) => /^[A-Z_]+=/.test(zeile))
    .map((zeile) => {
      const i = zeile.indexOf("=");
      return [zeile.slice(0, i), zeile.slice(i + 1).replace(/^"|"$/g, "")];
    }),
);

export const API_URL = status.API_URL;
const OEFFENTLICHER_SCHLUESSEL = status.PUBLISHABLE_KEY ?? status.ANON_KEY;
const GEHEIMER_SCHLUESSEL = status.SECRET_KEY ?? status.SERVICE_ROLE_KEY;

if (!/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(API_URL ?? "")) {
  throw new Error(`Backend-Tests laufen nur gegen das lokale Supabase, nicht gegen ${API_URL}`);
}

const OHNE_SPEICHERN = { auth: { persistSession: false, autoRefreshToken: false } };

// Zugang des Backends (wie in den Edge Functions) – nur zum Nachprüfen und Vorbereiten
export const admin = createClient(API_URL, GEHEIMER_SCHLUESSEL, OHNE_SPEICHERN);

// Ein neuer Gast (anonyme Anmeldung), so wie später im Browser
export async function neuerGast() {
  const client = createClient(API_URL, OEFFENTLICHER_SCHLUESSEL, OHNE_SPEICHERN);
  const { data, error } = await client.auth.signInAnonymously();
  if (error) throw error;
  return { client, id: data.user.id, token: data.session.access_token };
}

// Ruft eine Edge Function als dieser Gast auf. Ergebnis: { status, daten }
export async function rufe(gast, funktion, eingabe) {
  const antwort = await fetch(`${API_URL}/functions/v1/${funktion}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${gast.token}`,
      apikey: OEFFENTLICHER_SCHLUESSEL,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eingabe),
  });
  return { status: antwort.status, daten: await antwort.json().catch(() => null) };
}

export async function erstelleSitzung(gast, raumId = "arbeitszimmer") {
  const { status, daten } = await rufe(gast, "sitzung-erstellen", { raumId });
  if (status !== 201) throw new Error(`sitzung-erstellen: ${status} ${JSON.stringify(daten)}`);
  return daten.sitzung;
}

export const beitreten = (gast, code) => rufe(gast, "sitzung-beitreten", { code });
export const laden = (gast, sitzungId) => rufe(gast, "sitzung-laden", { sitzungId });
export const aktion = (gast, sitzungId, inhalt, aktionId = randomUUID()) =>
  rufe(gast, "aktion", { sitzungId, aktionId, aktion: inhalt });

// Sitzung direkt aus der Datenbank (am Backend vorbei, nur zum Nachprüfen)
export async function sitzungInDb(sitzungId) {
  const { data, error } = await admin.from("sitzungen").select("*").eq("id", sitzungId).single();
  if (error) throw error;
  return data;
}

export async function mitgliederInDb(sitzungId) {
  const { data, error } = await admin.from("sitzung_mitglieder").select("*").eq("sitzung_id", sitzungId);
  if (error) throw error;
  return data;
}

export const warte = (ms) => new Promise((fertig) => setTimeout(fertig, ms));

// Zeitstempel der Datenbank in Mikrosekunden. JavaScripts Date rechnet nur mit Millisekunden –
// zu grob, wenn zwei Einträge innerhalb derselben Millisekunde gespeichert werden.
export function mikrosekunden(zeitstempel) {
  const [, ohneBruch, bruch = ""] = zeitstempel.match(/^([^.+Z]+)(?:\.(\d+))?/);
  const zone = zeitstempel.slice(zeitstempel.search(/[+-]\d\d:?\d\d$|Z$/));
  return BigInt(Date.parse(ohneBruch + zone)) * 1000n + BigInt(bruch.padEnd(6, "0").slice(0, 6));
}
