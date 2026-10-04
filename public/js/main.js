// Einstiegspunkt: lädt den Raum und verbindet Anzeige und Spiel.
import raum from "/shared/raeume/arbeitszimmer.js";
import { erstelleLokaleVerbindung } from "./verbindung-lokal.js";
import {
  zeichneSzene, zoomeHinein, zoomeHeraus, zeigeText, zeigeZurueckKnopf, beimZurueck, zeigeSpielstand,
} from "./anzeige.js";

document.title = `${raum.titel} – Escape Room`;
document.querySelector(".raumtitel").textContent = raum.titel;

// Über die Verbindung läuft alles, was den Spielstand betrifft (später: Server im Mehrspieler-Modus).
const verbindung = erstelleLokaleVerbindung(raum);

// Welche Szene gerade zu sehen ist, ist nur für dieses Gerät wichtig (nicht Teil des Spielstands).
let aktuelleSzene = raum.startSzene;
// Der Weg zurück: Bei jedem Hineinzoomen merken wir uns die vorige Szene und den Zoompunkt.
const verlauf = [];

function beiKlick(objekt) {
  if (objekt.aktion?.typ === "oeffneSzene") {
    const mitte = { x: objekt.x + objekt.breite / 2, y: objekt.y + objekt.hoehe / 2 };
    verlauf.push({ szene: aktuelleSzene, ursprung: mitte });
    aktuelleSzene = objekt.aktion.ziel;
    zeigeZurueckKnopf(true);
    zoomeHinein(raum.szenen[aktuelleSzene], mitte, beiKlick);
  } else {
    zeigeText(objekt.name, objekt.text);
    // Ob das Objekt eine Spur liefert, entscheidet die Spiellogik
    verbindung.sendeAktion({ typ: "untersuche", objekt: objekt.id });
  }
}

beimZurueck(() => {
  const vorher = verlauf.pop();
  if (!vorher) return;
  aktuelleSzene = vorher.szene;
  zeigeZurueckKnopf(verlauf.length > 0);
  zoomeHeraus(raum.szenen[aktuelleSzene], vorher.ursprung, beiKlick);
});

zeichneSzene(raum.szenen[aktuelleSzene], beiKlick);
verbindung.beiAenderung((spielstand) => zeigeSpielstand(raum, spielstand));
