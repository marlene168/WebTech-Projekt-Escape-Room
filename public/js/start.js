// Startseite: zeigt für jeden Raum eine Karte mit Schwierigkeit, Dauer und Kurzbeschreibung.
import { raeume, SCHWIERIGKEITEN } from "/shared/raeume/index.js";

const liste = document.querySelector(".raum-liste");

for (const raum of raeume) {
  liste.append(erstelleKarte(raum));
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

  const spielen = document.createElement("a");
  spielen.className = "knopf knopf-haupt";
  spielen.href = `spiel.html?raum=${encodeURIComponent(raum.id)}`;
  spielen.textContent = "Spielen";

  info.append(titel, eckdaten, beschreibung);

  // Vorwarnung nur bei Räumen, die einen Schreckmoment haben (siehe "schreck" in den Raumdaten)
  if (raum.geschichte.verloren.schreck) {
    const hinweis = document.createElement("p");
    hinweis.className = "raum-hinweis";
    hinweis.textContent = "⚠ Enthält einen Schreckmoment mit Ton";
    info.append(hinweis);
  }

  info.append(spielen);
  karte.append(vorschau, info);
  return karte;
}
