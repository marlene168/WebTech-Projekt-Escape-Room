// Startseite: zeigt für jeden Raum eine Karte mit Schwierigkeit, Dauer und Kurzbeschreibung.
// "Spielen" erstellt eine neue Sitzung; über den Code tritt man der Sitzung einer anderen Person bei.
import { raeume, SCHWIERIGKEITEN } from "/shared/raeume/index.js";
import { erstelleSitzung, trittBei, BACKEND_EINGERICHTET } from "./verbindung-online.js";

const liste = document.querySelector(".raum-liste");
const meldung = document.querySelector(".start-meldung");
const beitretenFormular = document.querySelector(".beitreten");

const MELDUNGEN = {
  unbekannter_code: "Diesen Code gibt es nicht. Bitte prüfe die Eingabe.",
  schon_gestartet: "Diese Sitzung hat schon begonnen oder ist beendet. Beitreten geht nur vor dem Start.",
  voll: "Diese Sitzung ist voll (höchstens vier Personen).",
  kein_zugriff: "Du bist kein Mitglied dieser Sitzung. Bitte tritt über den Code deiner Gruppe bei.",
  keine_verbindung: "Keine Verbindung zum Server. Bitte versuche es noch einmal.",
  netzwerk: "Keine Verbindung zum Server. Bitte versuche es noch einmal.",
  nicht_eingerichtet: "Das Online-Spiel ist hier noch nicht eingerichtet.",
};

function zeigeMeldung(grund) {
  meldung.textContent = MELDUNGEN[grund] ?? `Das hat nicht geklappt (${grund}).`;
  meldung.hidden = false;
}

// Hinweis von der Spielseite, z. B. ?hinweis=kein_zugriff
const hinweis = new URLSearchParams(location.search).get("hinweis");
if (hinweis) zeigeMeldung(hinweis);
if (!BACKEND_EINGERICHTET) {
  zeigeMeldung("nicht_eingerichtet");
  beitretenFormular.hidden = true;
}

for (const raum of raeume) {
  liste.append(erstelleKarte(raum));
}

beitretenFormular.addEventListener("submit", async (ereignis) => {
  ereignis.preventDefault();
  const knopf = beitretenFormular.querySelector("button");
  knopf.disabled = true;
  try {
    location.href = `spiel.html?sitzung=${await trittBei(beitretenFormular.code.value)}`;
  } catch (fehler) {
    zeigeMeldung(fehler.grund);
    knopf.disabled = false;
  }
});

async function spielen(raum, knopf) {
  knopf.disabled = true;
  knopf.textContent = "Sitzung wird erstellt …";
  try {
    location.href = `spiel.html?sitzung=${await erstelleSitzung(raum.id)}`;
  } catch (fehler) {
    zeigeMeldung(fehler.grund);
    knopf.disabled = false;
    knopf.textContent = "Spielen";
  }
}

function erstelleKarte(raum) {
  const karte = document.createElement("article");
  karte.className = "raum-karte";

  // Vorschaubild – solange keines da ist, der Platzhalter-Hintergrund der Startszene
  const vorschau = document.createElement("div");
  vorschau.className = "raum-vorschau";
  if (raum.vorschaubild) {
    vorschau.style.backgroundImage = `url("${raum.vorschaubild}")`;
  } else {
    vorschau.classList.add(`platzhalter-${raum.szenen[raum.startSzene].platzhalter}`);
    vorschau.textContent = "🚪";
  }

  const info = document.createElement("div");
  info.className = "raum-info";

  const titel = document.createElement("h2");
  titel.textContent = raum.titel;

  const sterne = "★".repeat(raum.schwierigkeit) + "☆".repeat(3 - raum.schwierigkeit);
  const eckdaten = document.createElement("p");
  eckdaten.className = "raum-eckdaten";
  eckdaten.innerHTML = `<span class="sterne" aria-hidden="true">${sterne}</span>`;
  eckdaten.append(` ${SCHWIERIGKEITEN[raum.schwierigkeit]} · ⏳ ${raum.dauerSekunden / 60} Min.`);

  const beschreibung = document.createElement("p");
  beschreibung.className = "raum-beschreibung";
  beschreibung.textContent = raum.kurzbeschreibung;

  const spielenKnopf = document.createElement("button");
  spielenKnopf.className = "knopf knopf-haupt";
  spielenKnopf.textContent = "Spielen";
  spielenKnopf.disabled = !BACKEND_EINGERICHTET;
  spielenKnopf.addEventListener("click", () => spielen(raum, spielenKnopf));

  info.append(titel, eckdaten, beschreibung);

  // Vorwarnung nur bei Räumen, die einen Schreckmoment haben (siehe "schreck" in den Raumdaten)
  if (raum.geschichte.verloren.schreck) {
    const hinweis = document.createElement("p");
    hinweis.className = "raum-hinweis";
    hinweis.textContent = "⚠ Enthält einen Schreckmoment mit Ton";
    info.append(hinweis);
  }

  info.append(spielenKnopf);
  karte.append(vorschau, info);
  return karte;
}
