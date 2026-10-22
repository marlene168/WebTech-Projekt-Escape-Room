// Kern der Edge Functions: die Spielregeln für Sitzungen als reine Funktionen.
// Kein Zugriff auf Datenbank oder Netz – deshalb mit node:test prüfbar (test/kern.test.js).
// Die Edge Functions kümmern sich nur um Anmeldung, Datenbank und Antwort.
//
// Die Spiellogik selbst ist dieselbe wie im Browser (public/shared/spiel-logik.js), hier aber mit
// den geheimen Raumdaten und der Uhr des Servers.
import { findeRaum } from "../../../public/shared/raeume/index.js";
import { mitGeheimnissen } from "./raeume/geheim.js";
import { erstelleSpielstand, verarbeiteAktion, pruefeZeit } from "../../../public/shared/spiel-logik.js";

// Höchstens so viele Personen pro Sitzung (Entscheidung vom 2026-10-22)
export const MAX_MITGLIEDER = 4;

// Vollständiger Raum (öffentliche Daten plus Lösungen und Tipp-Texte) oder undefined
export function vollstaendigerRaum(raumId) {
  const raum = findeRaum(raumId);
  return raum ? mitGeheimnissen(raum) : undefined;
}

export function neuerSpielstand(raum) {
  return erstelleSpielstand(raum);
}

// Zeitablauf mit der Uhr des Servers erkennen – beim Laden, beim Beitreten und vor jeder Aktion.
// Gibt denselben Zustand zurück, wenn sich nichts ändert.
export function mitServerzeit(zustand, jetzt) {
  return pruefeZeit(zustand, jetzt);
}

const istText = (wert) => typeof wert === "string" && wert.length > 0 && wert.length <= 100;

// Nur bekannte Aktionen mit gültigen Feldern; alles andere wird verworfen.
// "neustart" gibt es online nicht: Erneutes Spielen erzeugt eine neue Sitzung.
function bereinigeAktion(aktion) {
  switch (aktion?.typ) {
    case "start":
      return { typ: "start" };
    case "verlassen":
      return { typ: "verlassen" };
    case "untersuche":
      return istText(aktion.objekt) ? { typ: "untersuche", objekt: aktion.objekt } : null;
    case "loese":
      return istText(aktion.raetsel) && istText(aktion.eingabe)
        ? { typ: "loese", raetsel: aktion.raetsel, eingabe: aktion.eingabe }
        : null;
    case "tipp":
      return Number.isInteger(aktion.nummer) ? { typ: "tipp", nummer: aktion.nummer } : null;
    default:
      return null;
  }
}

// Entscheidet über eine Aktion in einer Sitzung.
//   sitzung: Zeile aus der Tabelle "sitzungen" (raum_version, erstellt_von, zustand …)
// Ergebnis: { abgelehnt: "<grund>" } oder { aktion, zustand } – "zustand" ist derselbe Zustand
// wie vorher, wenn die Aktion nichts ändert.
export function bearbeiteAktion({ raum, sitzung, userId, aktion, jetzt }) {
  const bereinigt = bereinigeAktion(aktion);
  if (!bereinigt) return { abgelehnt: "ungueltige_aktion" };
  if (bereinigt.typ === "verlassen") return verlasse(sitzung, userId, jetzt);
  // Wurde der Raum seit dem Erstellen der Sitzung geändert, passen die Lösungen nicht mehr
  if (sitzung.raum_version !== raum.version) return { abgelehnt: "raum_veraltet" };
  // Nur die erstellende Person startet (Entscheidung vom 2026-10-22); Tipps dürfen alle holen
  if (bereinigt.typ === "start" && userId !== sitzung.erstellt_von) return { abgelehnt: "nur_ersteller_startet" };

  const aktuell = mitServerzeit(sitzung.zustand, jetzt);
  return { aktion: bereinigt, zustand: verarbeiteAktion(raum, aktuell, bereinigt, jetzt) };
}

// Verlässt die erstellende Person die Sitzung bewusst (Klick auf "Verlassen"), ist sie für alle
// beendet – vor dem Start ebenso wie während des Spiels (Entscheidung vom 2026-10-22).
// Neuladen oder ein Verbindungsabbruch lösen das nicht aus: Das Backend kennt nur diese Aktion.
// Andere Mitglieder verlassen die Sitzung einfach, indem sie die Seite schließen.
function verlasse(sitzung, userId, jetzt) {
  if (userId !== sitzung.erstellt_von) return { abgelehnt: "nur_ersteller_beendet" };

  const aktuell = mitServerzeit(sitzung.zustand, jetzt);
  if (aktuell.status !== "bereit" && aktuell.status !== "laeuft") return { aktion: { typ: "verlassen" }, zustand: aktuell };
  return { aktion: { typ: "verlassen" }, zustand: { ...aktuell, status: "beendet", endzeit: jetzt } };
}
