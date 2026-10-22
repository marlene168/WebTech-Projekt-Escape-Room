// Online-Verbindung zum Backend (Supabase): Gastanmeldung, Sitzungen und Live-Spielstand.
//
// Die Spielseite spricht wie früher nur über sendeAktion(aktion) und beiAenderung(callback)
// mit dem Spiel. Über den Spielstand entscheidet aber das Backend: Der Browser schickt nur
// Aktionsversuche und zeigt an, was das Backend bestätigt (per Antwort oder per Realtime).
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/+esm";
import { restzeit } from "/shared/spiel-logik.js";
import { SUPABASE_URL, SUPABASE_SCHLUESSEL, BACKEND_EINGERICHTET } from "./supabase-konfig.js";

export { BACKEND_EINGERICHTET };

// Der Supabase-Client speichert die Gastanmeldung im Browser – nach dem Neuladen ist man dieselbe Person.
const supabase = BACKEND_EINGERICHTET ? createClient(SUPABASE_URL, SUPABASE_SCHLUESSEL) : null;

// Fehler mit dem Grund aus dem Backend, z. B. "voll" oder "kein_zugriff" ("netzwerk" = keine Verbindung)
export class BackendFehler extends Error {
  constructor(grund, status) {
    super(grund);
    this.grund = grund;
    this.status = status;
  }
}

// Einmal pro Browser als Gast anmelden (ohne Registrierung). Eine gespeicherte Anmeldung wird einmal
// pro Seitenaufruf beim Server geprüft – gibt es den Gast dort nicht mehr (z. B. gelöscht), neu anmelden.
let anmeldung = null;
async function anmelden() {
  anmeldung ??= (async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session && !(await supabase.auth.getUser()).error) return data.session;
    if (data.session) await supabase.auth.signOut({ scope: "local" });
    const { data: neu, error } = await supabase.auth.signInAnonymously();
    if (error) throw new BackendFehler("anmeldung_fehlgeschlagen");
    return neu.session;
  })();
  try {
    return await anmeldung;
  } catch (fehler) {
    anmeldung = null; // beim nächsten Versuch neu probieren
    throw fehler;
  }
}

async function rufe(funktion, eingabe) {
  await anmelden();
  const { data, error } = await supabase.functions.invoke(funktion, { body: eingabe });
  if (!error) return data;
  const antwort = error.context;
  const inhalt = antwort?.json ? await antwort.json().catch(() => null) : null;
  throw new BackendFehler(inhalt?.fehler ?? "netzwerk", antwort?.status);
}

// Neue Sitzung für einen Raum; Ergebnis: Sitzungs-ID
export async function erstelleSitzung(raumId) {
  return (await rufe("sitzung-erstellen", { raumId })).sitzung.id;
}

// Beitritt per Code; Ergebnis: Sitzungs-ID
export async function trittBei(code) {
  return (await rufe("sitzung-beitreten", { code })).sitzung.id;
}

// Verbindet die Spielseite mit einer Sitzung (nur für Mitglieder, sonst BackendFehler "kein_zugriff").
export async function verbindeMitSitzung(sitzungId) {
  const anmeldung = await anmelden();
  const erste = await rufe("sitzung-laden", { sitzungId });
  let sitzung = erste.sitzung;
  // Abweichung der eigenen Uhr von der Serveruhr – damit alle dieselbe Restzeit sehen
  let abweichung = erste.serverzeit - Date.now();
  const uhr = () => Date.now() + abweichung;

  const zuhoerer = [];
  const mitgliederZuhoerer = [];

  // Übernimmt einen bestätigten Stand – aber nur, wenn er neuer ist als der bisherige
  // (Antworten und Realtime-Nachrichten können in beliebiger Reihenfolge eintreffen).
  function uebernehme(neu, serverzeit) {
    if (serverzeit) abweichung = serverzeit - Date.now();
    if (!neu || neu.version <= sitzung.version) return;
    sitzung = { ...sitzung, ...neu };
    zuhoerer.forEach((callback) => callback(sitzung.zustand));
  }

  // Abgleich mit dem Backend: holt den aktuellen Stand. Das Backend erkennt dabei auch den Zeitablauf.
  async function gleicheAb() {
    try {
      const { sitzung: neu, serverzeit } = await rufe("sitzung-laden", { sitzungId });
      uebernehme(neu, serverzeit);
    } catch (fehler) {
      console.warn("Abgleich fehlgeschlagen:", fehler.grund ?? fehler);
    }
  }

  async function zaehleMitglieder() {
    const { count } = await supabase
      .from("sitzung_mitglieder").select("user_id", { count: "exact", head: true }).eq("sitzung_id", sitzungId);
    if (count != null) mitgliederZuhoerer.forEach((callback) => callback(count));
  }

  // Realtime: bestätigte Änderungen an der Sitzung und neue Mitglieder.
  // Erst mit der Systemnachricht "Subscribed to PostgreSQL" kommen Änderungen sicher an – deshalb
  // wird genau dann (auch nach jedem automatischen Wiederverbinden) noch einmal abgeglichen.
  // So geht keine Änderung verloren, die zwischen Laden und Abonnieren passiert ist.
  supabase
    .channel(`sitzung-${sitzungId}`)
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "sitzungen", filter: `id=eq.${sitzungId}` },
      (nachricht) => uebernehme(nachricht.new))
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "sitzung_mitglieder", filter: `sitzung_id=eq.${sitzungId}` },
      () => zaehleMitglieder())
    .on("system", {}, (nachricht) => {
      if (nachricht.extension === "postgres_changes" && nachricht.status === "ok") {
        gleicheAb();
        zaehleMitglieder();
      }
    })
    .subscribe();

  // Zurück online oder Tab wieder sichtbar: sicherheitshalber abgleichen
  window.addEventListener("online", gleicheAb);
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && gleicheAb());

  // Läuft die Zeit laut Anzeige ab, beim Backend nachfragen – dort wird der Zeitablauf festgestellt.
  let ablaufGefragt = false;
  setInterval(() => {
    if (sitzung.zustand.status !== "laeuft" || restzeit(sitzung.zustand, uhr()) > 0 || ablaufGefragt) return;
    ablaufGefragt = true;
    gleicheAb().finally(() => setTimeout(() => (ablaufGefragt = false), 2000));
  }, 500);

  return {
    sitzung,
    istErsteller: sitzung.erstellt_von === anmeldung.user.id,
    uhr,

    // Schickt einen Aktionsversuch. Jede Aktion bekommt eine eigene ID; geht die Verbindung
    // verloren, wird sie mit derselben ID noch einmal gesendet – das Backend wertet sie nur einmal.
    async sendeAktion(aktion) {
      const aktionId = crypto.randomUUID();
      for (let versuch = 1; ; versuch++) {
        try {
          const { sitzung: neu, serverzeit } = await rufe("aktion", { sitzungId, aktionId, aktion });
          uebernehme(neu, serverzeit);
          return;
        } catch (fehler) {
          if (fehler.grund !== "netzwerk" || versuch >= 3) throw fehler;
          await new Promise((weiter) => setTimeout(weiter, 500 * versuch));
        }
      }
    },

    beiAenderung(callback) {
      zuhoerer.push(callback);
      callback(sitzung.zustand); // sofort einmal mit dem aktuellen Stand aufrufen
    },

    beiMitgliedern(callback) {
      mitgliederZuhoerer.push(callback);
    },
  };
}
