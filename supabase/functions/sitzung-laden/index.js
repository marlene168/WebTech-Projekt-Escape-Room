// Edge Function "sitzung-laden": aktuellen Stand einer Sitzung holen (nur für Mitglieder).
// Eingabe: { sitzungId }   Antwort: { sitzung, serverzeit }
// Wird beim Neuladen und nach jedem Wiederverbinden genutzt; erkennt dabei auch den Zeitablauf.
import { withSupabase } from "@supabase/server";
import {
  antworteMitSitzung, lehneAb, leseEingabe, nutzerId, istUuid, ladeSitzung, istMitglied, mitAktuellerZeit,
} from "../_shared/sitzungen.js";

export default {
  fetch: withSupabase({ auth: "user" }, async (anfrage, ctx) => {
    try {
      const { sitzungId } = await leseEingabe(anfrage);
      if (!istUuid(sitzungId)) return lehneAb(400, "ungueltige_sitzung");

      const admin = ctx.supabaseAdmin;
      const sitzung = await ladeSitzung(admin, sitzungId);
      // Unbekannt und "nicht Mitglied" sehen gleich aus – Fremde erfahren nichts über die Sitzung
      if (!sitzung || !(await istMitglied(admin, sitzungId, nutzerId(ctx)))) return lehneAb(403, "kein_zugriff");

      const jetzt = Date.now();
      return antworteMitSitzung(await mitAktuellerZeit(admin, sitzung, jetzt), jetzt);
    } catch (fehler) {
      console.error(fehler);
      return lehneAb(500, "interner_fehler");
    }
  }),
};
