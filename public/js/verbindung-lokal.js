// Lokale Verbindung: führt die Spiellogik direkt im Browser aus (Einzelspieler).
//
// Die Anzeige spricht nur über diese zwei Funktionen mit dem Spiel:
//   sendeAktion(aktion)     – z. B. { typ: "untersuche", objekt: "kalender" }
//   beiAenderung(callback)  – callback(spielstand) wird bei jeder Änderung aufgerufen
//
// Im Mehrspieler-Modus ersetzt eine "verbindung-online.js" mit denselben zwei Funktionen
// diese Datei. Sie schickt die Aktionen an den Server, der dieselbe Spiellogik ausführt.
//
// Vorübergehend (bis AP 4) holt sich diese Datei die geheimen Raumdaten, weil die Spiellogik
// hier noch im Browser läuft. Danach entfällt sie, und der Browser bekommt keine Geheimnisse mehr.
import { erstelleSpielstand, verarbeiteAktion, pruefeZeit } from "/shared/spiel-logik.js";
import { mitGeheimnissen } from "/shared/raeume/geheim.js";

export function erstelleLokaleVerbindung(oeffentlicherRaum) {
  const raum = mitGeheimnissen(oeffentlicherRaum);
  let spielstand = erstelleSpielstand(raum);
  const zuhoerer = [];

  function uebernehme(neu) {
    if (neu === spielstand) return;
    spielstand = neu;
    zuhoerer.forEach((callback) => callback(spielstand));
  }

  // Die Zeit läuft auch ab, wenn niemand klickt – deshalb regelmäßig nachsehen.
  setInterval(() => uebernehme(pruefeZeit(spielstand, Date.now())), 250);

  return {
    sendeAktion(aktion) {
      uebernehme(verarbeiteAktion(raum, spielstand, aktion, Date.now()));
    },

    beiAenderung(callback) {
      zuhoerer.push(callback);
      callback(spielstand); // sofort einmal mit dem aktuellen Stand aufrufen
    },
  };
}
