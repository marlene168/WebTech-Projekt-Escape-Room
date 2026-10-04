// Einstiegspunkt: lädt den Raum und verbindet Daten und Anzeige.
import raum from "/shared/raeume/arbeitszimmer.js";
import { zeichneSzene, zeigeText } from "./anzeige.js";

document.title = `${raum.titel} – Escape Room`;
document.querySelector(".raumtitel").textContent = raum.titel;

zeichneSzene(raum.szenen[raum.startSzene], (objekt) => {
  zeigeText(objekt.name, objekt.text);
});
