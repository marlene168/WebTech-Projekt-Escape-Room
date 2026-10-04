// Lokale Verbindung: führt die Spiellogik direkt im Browser aus (Einzelspieler).
//
// Die Anzeige spricht nur über diese zwei Funktionen mit dem Spiel:
//   sendeAktion(aktion)     – z. B. { typ: "untersuche", objekt: "kalender" }
//   beiAenderung(callback)  – callback(spielstand) wird bei jeder Änderung aufgerufen
//
// Im Mehrspieler-Modus ersetzt eine "verbindung-online.js" mit denselben zwei Funktionen
// diese Datei. Sie schickt die Aktionen an den Server, der dieselbe Spiellogik ausführt.
import { erstelleSpielstand, verarbeiteAktion } from "/shared/spiel-logik.js";

export function erstelleLokaleVerbindung(raum) {
  let spielstand = erstelleSpielstand(raum);
  const zuhoerer = [];

  return {
    sendeAktion(aktion) {
      const neu = verarbeiteAktion(raum, spielstand, aktion);
      if (neu === spielstand) return;
      spielstand = neu;
      zuhoerer.forEach((callback) => callback(spielstand));
    },

    beiAenderung(callback) {
      zuhoerer.push(callback);
      callback(spielstand); // sofort einmal mit dem aktuellen Stand aufrufen
    },
  };
}
