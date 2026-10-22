// Gemeinsame Bausteine der Edge Functions: Antworten, Eingaben lesen, Sitzungen laden.
// "admin" ist der Datenbankzugang des Backends (service_role, siehe @supabase/server).
import { mitServerzeit } from "./kern.js";

export function antworte(status, daten) {
  return Response.json(daten, { status });
}

export function lehneAb(status, grund) {
  return antworte(status, { fehler: grund });
}

// Antwort mit der Sitzung und der Serverzeit (der Browser rechnet damit die Abweichung seiner Uhr aus)
export function antworteMitSitzung(sitzung, jetzt, status = 200) {
  const { id, raum_id, raum_version, beitrittscode, erstellt_von, zustand, version } = sitzung;
  return antworte(status, {
    sitzung: { id, raum_id, raum_version, beitrittscode, erstellt_von, zustand, version },
    serverzeit: jetzt,
  });
}

export async function leseEingabe(anfrage) {
  try {
    const eingabe = await anfrage.json();
    return eingabe && typeof eingabe === "object" ? eingabe : {};
  } catch {
    return {};
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const istUuid = (wert) => typeof wert === "string" && UUID.test(wert);

export function nutzerId(ctx) {
  return ctx.userClaims?.id ?? ctx.jwtClaims?.sub;
}

export async function ladeSitzung(admin, sitzungId) {
  const { data, error } = await admin.from("sitzungen").select("*").eq("id", sitzungId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function istMitglied(admin, sitzungId, userId) {
  const { data, error } = await admin
    .from("sitzung_mitglieder").select("user_id").eq("sitzung_id", sitzungId).eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

// Prüft mit der Serverzeit, ob die Zeit abgelaufen ist, und speichert das gegebenenfalls.
// War jemand anderes schneller (Versionskonflikt), wird neu geladen und erneut geprüft.
export async function mitAktuellerZeit(admin, sitzung, jetzt) {
  for (let versuch = 0; versuch < 3; versuch++) {
    const zustand = mitServerzeit(sitzung.zustand, jetzt);
    if (zustand === sitzung.zustand) return sitzung;

    const { data, error } = await admin.rpc("speichere_zustand", {
      p_sitzung: sitzung.id, p_erwartete_version: sitzung.version, p_neuer_zustand: zustand,
    });
    if (error) throw error;
    if (data) return data;
    sitzung = await ladeSitzung(admin, sitzung.id);
  }
  return sitzung;
}
