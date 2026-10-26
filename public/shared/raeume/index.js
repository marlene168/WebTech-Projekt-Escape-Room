// Liste aller Räume. Jeder Raum ist inhaltlich eigenständig und hat einen festen Schwierigkeitsgrad.
//
// Neue Räume hier HINTEN anhängen: Spätere Räume sind schwerer (oder gleich schwer) als frühere.
// Die Tests prüfen das (test/raeume.test.js). Die Startseite zeigt die Räume in dieser Reihenfolge.
import arbeitszimmer from "./arbeitszimmer.js";
import waschsalon from "./waschsalon.js";

export const raeume = [arbeitszimmer, waschsalon];

export const SCHWIERIGKEITEN = { 1: "Leicht", 2: "Mittel", 3: "Schwer" };

export function findeRaum(id) {
  return raeume.find((raum) => raum.id === id);
}
