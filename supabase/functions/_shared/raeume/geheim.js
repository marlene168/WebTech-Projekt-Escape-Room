// Geheime Raumdaten (Lösungen, Tipp-Texte) und das Zusammensetzen mit den öffentlichen Raumdaten.
//
// Die Spiellogik braucht den vollständigen Raum: öffentliche Daten (public/shared/raeume/) plus "geheim".
// Diese Dateien liegen nur im Backend und werden nie an den Browser ausgeliefert.
// Neuer Raum: seine .geheim.js-Datei hier importieren und unten eintragen.
import arbeitszimmer from "./arbeitszimmer.geheim.js";
import waschsalon from "./waschsalon.geheim.js";

const geheimeDaten = { arbeitszimmer, waschsalon };

export function geheimnisseVon(raumId) {
  return geheimeDaten[raumId];
}

export function mitGeheimnissen(raum) {
  return { ...raum, geheim: geheimnisseVon(raum.id) };
}
