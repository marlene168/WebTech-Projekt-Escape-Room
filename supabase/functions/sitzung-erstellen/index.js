// Edge Function "sitzung-erstellen": neue Sitzung für einen Raum.
// Eingabe: { raumId }   Antwort: { sitzung, serverzeit }
// Die erstellende Person wird Mitglied und darf als einzige starten.
// Pro Gast höchstens 10 neue Sitzungen pro Stunde (Antwort 429 "zu_viele_sitzungen").
import { withSupabase } from "@supabase/server";
import { vollstaendigerRaum, neuerSpielstand } from "../_shared/kern.js";
import { antworteMitSitzung, lehneAb, leseEingabe, nutzerId } from "../_shared/sitzungen.js";

export default {
  fetch: withSupabase({ auth: "user" }, async (anfrage, ctx) => {
    try {
      const { raumId } = await leseEingabe(anfrage);
      const raum = vollstaendigerRaum(raumId);
      if (!raum) return lehneAb(400, "unbekannter_raum");

      const { data, error } = await ctx.supabaseAdmin.rpc("erstelle_sitzung", {
        p_raum_id: raum.id,
        p_raum_version: raum.version,
        p_erstellt_von: nutzerId(ctx),
        p_zustand: neuerSpielstand(raum),
      });
      if (error) throw error;
      // Höchstens 10 neue Sitzungen pro Gast und Stunde (siehe Migration 20261023101615_sitzungslimit.sql)
      if (data.fehler) return lehneAb(429, data.fehler);
      return antworteMitSitzung(data, Date.now(), 201);
    } catch (fehler) {
      console.error(fehler);
      return lehneAb(500, "interner_fehler");
    }
  }),
};
