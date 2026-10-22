// Edge Function "sitzung-beitreten": Beitritt per Beitrittscode.
// Eingabe: { code }   Antwort: { sitzung, serverzeit }
// Neue Mitglieder nur, solange die Sitzung "bereit" ist und weniger als vier Personen dabei sind.
// Wer schon Mitglied ist, kommt jederzeit wieder hinein (die Zeit läuft dabei weiter).
import { withSupabase } from "@supabase/server";
import { MAX_MITGLIEDER } from "../_shared/kern.js";
import {
  antworteMitSitzung, lehneAb, leseEingabe, nutzerId, ladeSitzung, mitAktuellerZeit,
} from "../_shared/sitzungen.js";

const FEHLER = {
  unbekannter_code: 404,
  schon_gestartet: 409,
  voll: 409,
};

export default {
  fetch: withSupabase({ auth: "user" }, async (anfrage, ctx) => {
    try {
      const { code } = await leseEingabe(anfrage);
      if (typeof code !== "string" || code.length > 20) return lehneAb(400, "ungueltiger_code");

      const { data, error } = await ctx.supabaseAdmin.rpc("tritt_bei", {
        p_code: code.trim().toUpperCase(),
        p_user: nutzerId(ctx),
        p_max: MAX_MITGLIEDER,
      });
      if (error) throw error;
      if (FEHLER[data.ergebnis]) return lehneAb(FEHLER[data.ergebnis], data.ergebnis);

      const jetzt = Date.now();
      const sitzung = await mitAktuellerZeit(ctx.supabaseAdmin, await ladeSitzung(ctx.supabaseAdmin, data.sitzung_id), jetzt);
      return antworteMitSitzung(sitzung, jetzt);
    } catch (fehler) {
      console.error(fehler);
      return lehneAb(500, "interner_fehler");
    }
  }),
};
