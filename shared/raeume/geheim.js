// Geheime Raumdaten (Lösungen, Tipp-Texte) und das Zusammensetzen mit den öffentlichen Raumdaten.
//
// Die Spiellogik braucht den vollständigen Raum: öffentliche Daten plus "geheim".
// Vorübergehend nutzt auch die lokale Verbindung im Browser diese Datei. Ab AP 4 zieht sie
// ins Backend (supabase/functions/_shared/), und der Browser bekommt keine Geheimnisse mehr.
import arbeitszimmer from "./arbeitszimmer.geheim.js";

const geheimeDaten = { arbeitszimmer };

export function geheimnisseVon(raumId) {
  return geheimeDaten[raumId];
}

export function mitGeheimnissen(raum) {
  return { ...raum, geheim: geheimnisseVon(raum.id) };
}
