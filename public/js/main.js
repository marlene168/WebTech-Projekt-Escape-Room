// Einstiegspunkt der Spielseite: verbindet sich mit der Sitzung aus der Adresse (spiel.html?sitzung=<id>)
// und verbindet Anzeige und Spiel. Den Spielstand bestimmt das Backend (siehe verbindung-online.js).
import { findeRaum } from "/shared/raeume/index.js";
import { verbindeMitSitzung, erstelleSitzung, BACKEND_EINGERICHTET } from "./verbindung-online.js";
import {
  zeichneSzene, zoomeHinein, zoomeHeraus, zeigeText, zeigeZurueckKnopf, beimZurueck, zeigeSpielstand,
  zeigeSchloss, beimNeustart, beimTippAnfordern, beimRaumBetreten, beimVerlassen, setzeUhr, zeigeSitzung,
  zeigeMitglieder,
} from "./anzeige.js";

// Welche Anzeige zu welchem Rätseltyp gehört (die Typen selbst stehen in shared/raetsel/)
const RAETSEL_ANZEIGEN = { zahlenschloss: zeigeSchloss };
const MAX_MITGLIEDER = 4;

const sitzungId = new URLSearchParams(location.search).get("sitzung");
const zurStartseite = (hinweis) => location.replace(hinweis ? `./?hinweis=${hinweis}` : "./");

if (!BACKEND_EINGERICHTET) zurStartseite("nicht_eingerichtet");
else if (!sitzungId) zurStartseite();
else verbinde();

async function verbinde() {
  try {
    starteSpiel(await verbindeMitSitzung(sitzungId));
  } catch (fehler) {
    // Kein Mitglied (oder unbekannte Sitzung): Beitritt geht nur über den Code auf der Startseite
    zurStartseite(fehler.grund === "kein_zugriff" ? "kein_zugriff" : "keine_verbindung");
  }
}

function starteSpiel(verbindung) {
  const raum = findeRaum(verbindung.sitzung.raum_id);
  document.title = `${raum.titel} – Escape Room`;
  document.querySelector(".raumtitel").textContent = raum.titel;
  setzeUhr(verbindung.uhr); // Restzeit nach der Uhr des Servers
  zeigeSitzung({ code: verbindung.sitzung.beitrittscode, darfStarten: verbindung.istErsteller });
  verbindung.beiMitgliedern((anzahl) => zeigeMitglieder(anzahl, MAX_MITGLIEDER));

  // Aktionen schicken; lehnt das Backend ab oder fehlt die Verbindung, eine kurze Meldung zeigen
  const sende = (aktion) => verbindung.sendeAktion(aktion).catch((fehler) => {
    zeigeText("Das hat nicht geklappt", fehler.grund === "netzwerk"
      ? "Keine Verbindung zum Server. Bitte prüfe deine Internetverbindung und versuche es noch einmal."
      : `Der Server hat die Aktion abgelehnt (${fehler.grund}).`);
  });

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
    } else if (objekt.aktion?.typ === "raetsel") {
      const name = objekt.aktion.raetsel;
      const raetsel = raum.raetsel[name];
      // Ob die Lösung stimmt, entscheidet das Backend
      RAETSEL_ANZEIGEN[raetsel.typ](raetsel, (eingabe) => sende({ typ: "loese", raetsel: name, eingabe }));
    } else {
      zeigeText(objekt.name, objekt.text);
      // Ob das Objekt eine Spur liefert, entscheidet das Backend
      sende({ typ: "untersuche", objekt: objekt.id });
    }
  }

  beimZurueck(() => {
    const vorher = verlauf.pop();
    if (!vorher) return;
    aktuelleSzene = vorher.szene;
    zeigeZurueckKnopf(verlauf.length > 0);
    zoomeHeraus(raum.szenen[aktuelleSzene], vorher.ursprung, beiKlick);
  });

  // Nur die erstellende Person sieht "Raum betreten" (das Backend prüft das zusätzlich)
  beimRaumBetreten(() => sende({ typ: "start" }));

  // Erneutes Spielen erzeugt eine neue Sitzung mit neuem Code
  beimNeustart(async () => {
    try {
      location.href = `spiel.html?sitzung=${await erstelleSitzung(raum.id)}`;
    } catch {
      zeigeText("Das hat nicht geklappt", "Die neue Sitzung konnte nicht erstellt werden. Bitte versuche es noch einmal.");
    }
  });

  // Verlässt die erstellende Person die Sitzung bewusst, ist sie für alle beendet (vorher nachfragen).
  // Andere Mitglieder gehen einfach. Neuladen oder Verbindungsabbruch sind kein Verlassen.
  let letzterSpielstand = null;
  beimVerlassen(async () => {
    const laeuftNoch = ["bereit", "laeuft"].includes(letzterSpielstand.status);
    if (!verbindung.istErsteller || !laeuftNoch) return true;
    if (!confirm("Wenn du die Sitzung verlässt, ist sie für alle beendet. Wirklich verlassen?")) return false;
    await sende({ typ: "verlassen" });
    return true;
  });

  // Die Aktion nennt die Nummer des Tipps, den diese Person gerade anfordert. Fordern mehrere
  // gleichzeitig denselben Tipp an, zählt das Backend ihn nur einmal.
  beimTippAnfordern(() => sende({ typ: "tipp", nummer: letzterSpielstand.freigegebeneTipps.length + 1 }));

  zeichneSzene(raum.szenen[aktuelleSzene], beiKlick);

  verbindung.beiAenderung((spielstand) => {
    letzterSpielstand = spielstand;
    zeigeSpielstand(raum, spielstand);
  });
}
