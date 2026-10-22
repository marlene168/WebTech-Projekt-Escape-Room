// Edge Function "aktion": ein Aktionsversuch eines Mitglieds (z. B. Objekt untersuchen, Code probieren).
// Eingabe: { sitzungId, aktionId, aktion }   Antwort: { sitzung, serverzeit }
// "aktionId" erzeugt der Browser einmal pro Aktion (UUID). Wird dieselbe Aktion doppelt gesendet,
// wirkt sie nur einmal. Über den neuen Spielstand entscheidet ausschließlich das Backend.
import { withSupabase } from "@supabase/server";
import { bearbeiteAktion, vollstaendigerRaum } from "../_shared/kern.js";
import {
  antworteMitSitzung, lehneAb, leseEingabe, nutzerId, istUuid, ladeSitzung, istMitglied,
} from "../_shared/sitzungen.js";

const MAX_VERSUCHE = 8;

const FEHLER = {
  ungueltige_aktion: 400,
  nur_ersteller_startet: 403,
  raum_veraltet: 409,
};

export default {
  fetch: withSupabase({ auth: "user" }, async (anfrage, ctx) => {
    try {
      const { sitzungId, aktionId, aktion } = await leseEingabe(anfrage);
      if (!istUuid(sitzungId) || !istUuid(aktionId)) return lehneAb(400, "ungueltige_eingabe");

      const admin = ctx.supabaseAdmin;
      const userId = nutzerId(ctx);
      if (!(await istMitglied(admin, sitzungId, userId))) return lehneAb(403, "kein_zugriff");

      // Kommt jemand anderes zuvor (Versionskonflikt), wird mit dem neuen Stand neu gerechnet.
      // Bei bis zu vier Personen reichen einige Versuche; die kurze Zufallspause verteilt sie.
      for (let versuch = 0; versuch < MAX_VERSUCHE; versuch++) {
        if (versuch > 0) await new Promise((weiter) => setTimeout(weiter, Math.random() * 20 * versuch));
        const sitzung = await ladeSitzung(admin, sitzungId);
        const raum = vollstaendigerRaum(sitzung.raum_id);
        const jetzt = Date.now();

        const ergebnis = bearbeiteAktion({ raum, sitzung, userId, aktion, jetzt });
        if (ergebnis.abgelehnt) return lehneAb(FEHLER[ergebnis.abgelehnt] ?? 400, ergebnis.abgelehnt);
        if (ergebnis.zustand === sitzung.zustand) return antworteMitSitzung(sitzung, jetzt); // nichts zu tun

        const { data, error } = await admin.rpc("speichere_aktion", {
          p_sitzung: sitzungId,
          p_aktion_id: aktionId,
          p_user: userId,
          p_typ: ergebnis.aktion.typ,
          p_daten: ergebnis.aktion,
          p_erwartete_version: sitzung.version,
          p_neuer_zustand: ergebnis.zustand,
        });
        if (error) throw error;
        if (data.ergebnis !== "versionskonflikt") return antworteMitSitzung(data.sitzung, jetzt);
      }
      return lehneAb(409, "zu_viele_gleichzeitige_aenderungen");
    } catch (fehler) {
      console.error(fehler);
      return lehneAb(500, "interner_fehler");
    }
  }),
};
