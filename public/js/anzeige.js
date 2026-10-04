// Anzeige: zeichnet Szenen und Objekte auf die Bühne, zoomt zwischen Szenen und zeigt Texte an.
// Enthält keine Spielregeln – nur Darstellung.

const szeneElement = document.querySelector(".szene");
const hintergrund = document.querySelector(".szene-hintergrund");
const zurueckKnopf = document.querySelector(".zurueck-knopf");
const textfenster = document.querySelector(".beschreibung");
const notizbuch = document.querySelector(".notizbuch");
const notizbuchKnopf = document.querySelector(".notizbuch-knopf");

// Die zuletzt angezeigten gefundenen Spuren (um neue zu erkennen und Objekte zu markieren)
let gefundeneSpuren = [];

// Wer in den Systemeinstellungen "Bewegung reduzieren" gewählt hat, bekommt keine Zoom-Animation.
const ohneAnimation = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const ZOOM_DAUER = 450; // Millisekunden
const ZOOM_FAKTOR = 2.5;

// Zeichnet eine Szene neu. "beiKlick" wird mit dem angeklickten Objekt aufgerufen.
export function zeichneSzene(szene, beiKlick) {
  // Hintergrund: echtes Bild, falls vorhanden, sonst Platzhalter
  hintergrund.className = "szene-hintergrund";
  if (szene.hintergrund) {
    hintergrund.style.backgroundImage = `url("${szene.hintergrund}")`;
  } else {
    hintergrund.style.backgroundImage = "";
    hintergrund.classList.add(`platzhalter-${szene.platzhalter}`);
  }

  // Alte Objekte entfernen, neue anlegen
  szeneElement.querySelectorAll(".objekt").forEach((element) => element.remove());
  for (const objekt of szene.objekte) {
    const element = erstelleObjekt(objekt);
    element.addEventListener("click", () => beiKlick(objekt));
    szeneElement.append(element);
  }
  markiereGefundene();
}

// Zeigt den aktuellen Spielstand an: Notizbuch, Zähler und Markierungen.
export function zeigeSpielstand(raum, spielstand) {
  const neue = spielstand.gefundeneSpuren.filter((spur) => !gefundeneSpuren.includes(spur));
  gefundeneSpuren = spielstand.gefundeneSpuren;

  markiereGefundene();
  zeichneNotizbuch(raum);
  if (neue.length > 0) meldeNeueSpur();
}

// Objekte, deren Spur schon gefunden wurde, bekommen ein Häkchen.
function markiereGefundene() {
  for (const element of szeneElement.querySelectorAll(".objekt[data-spur]")) {
    element.classList.toggle("gefunden", gefundeneSpuren.includes(element.dataset.spur));
  }
}

function zeichneNotizbuch(raum) {
  const liste = notizbuch.querySelector(".notizbuch-liste");
  liste.replaceChildren(
    ...gefundeneSpuren.map((name) => {
      const eintrag = document.createElement("li");
      const titel = document.createElement("strong");
      titel.textContent = raum.spuren[name].titel;
      const text = document.createElement("span");
      text.textContent = raum.spuren[name].text;
      eintrag.append(titel, text);
      return eintrag;
    }),
  );
  notizbuch.querySelector(".notizbuch-leer").hidden = gefundeneSpuren.length > 0;
  notizbuchKnopf.querySelector(".zaehler").textContent = gefundeneSpuren.length;
}

// Hinweis im offenen Textfenster und kurzes Aufleuchten des Notizbuch-Knopfs
function meldeNeueSpur() {
  if (textfenster.open) textfenster.querySelector(".textfenster-hinweis").hidden = false;
  notizbuchKnopf.classList.remove("neu");
  void notizbuchKnopf.offsetWidth; // erzwingt Neustart der Animation
  notizbuchKnopf.classList.add("neu");
}

notizbuchKnopf.addEventListener("click", () => notizbuch.showModal());

// Zoomt auf den Punkt "ursprung" ({ x, y } in Prozent) und zeigt danach die neue Szene.
export async function zoomeHinein(szene, ursprung, beiKlick) {
  await animiere(ursprung, ["scale(1)", `scale(${ZOOM_FAKTOR})`], "ease-in", () => {
    zeichneSzene(szene, beiKlick);
    return animiere({ x: 50, y: 50 }, ["scale(0.85)", "scale(1)"], "ease-out");
  });
}

// Umgekehrt: Die Detailszene wird kleiner, die vorige Szene kommt vom Punkt "ursprung" heran.
export async function zoomeHeraus(szene, ursprung, beiKlick) {
  await animiere({ x: 50, y: 50 }, ["scale(1)", "scale(0.85)"], "ease-in", () => {
    zeichneSzene(szene, beiKlick);
    return animiere(ursprung, [`scale(${ZOOM_FAKTOR})`, "scale(1)"], "ease-out");
  });
}

// Spielt eine Zoom-Animation der Szene ab (mit Ein- bzw. Ausblenden).
// "danach" wird ausgeführt, solange die Szene noch unsichtbar ist – so gibt es kein Flackern.
async function animiere(ursprung, [von, nach], easing, danach) {
  if (ohneAnimation) return danach?.();

  szeneElement.inert = true; // während der Animation keine Klicks
  szeneElement.style.transformOrigin = `${ursprung.x}% ${ursprung.y}%`;
  const ausblenden = !!danach;
  const animation = szeneElement.animate(
    [
      { transform: von, opacity: ausblenden ? 1 : 0 },
      { transform: nach, opacity: ausblenden ? 0 : 1 },
    ],
    // Ausgeblendet bleiben, bis die neue Szene gezeichnet ist
    { duration: ZOOM_DAUER, easing, fill: ausblenden ? "forwards" : "none" },
  );
  await animation.finished;

  const naechste = danach?.(); // startet die nächste Animation, bevor die alte entfernt wird
  animation.cancel();
  await naechste;
  szeneElement.inert = false;
}

export function zeigeZurueckKnopf(sichtbar) {
  zurueckKnopf.hidden = !sichtbar;
}

export function beimZurueck(callback) {
  zurueckKnopf.addEventListener("click", callback);
}

// Ein Objekt ist ein Knopf (dadurch auch per Tastatur bedienbar), positioniert in Prozent.
function erstelleObjekt(objekt) {
  const element = document.createElement("button");
  element.className = "objekt";
  element.title = objekt.name;
  element.style.left = `${objekt.x}%`;
  element.style.top = `${objekt.y}%`;
  element.style.width = `${objekt.breite}%`;
  element.style.height = `${objekt.hoehe}%`;
  if (objekt.aktion?.typ === "findeSpur") element.dataset.spur = objekt.aktion.spur;

  if (objekt.bild) {
    const bild = document.createElement("img");
    bild.src = objekt.bild;
    bild.alt = objekt.name;
    // Datei fehlt oder ist kaputt → Platzhalter statt leerer Fläche
    bild.addEventListener("error", () => zeigePlatzhalter(element, objekt));
    element.append(bild);
  } else {
    zeigePlatzhalter(element, objekt);
  }
  return element;
}

function zeigePlatzhalter(element, objekt) {
  element.classList.add("platzhalter");
  element.innerHTML = `
    <span class="platzhalter-emoji">${objekt.emoji}</span>
    <span class="platzhalter-name">${objekt.name}</span>`;
}

export function zeigeText(titel, text) {
  textfenster.querySelector(".textfenster-titel").textContent = titel;
  textfenster.querySelector(".textfenster-text").textContent = text;
  textfenster.querySelector(".textfenster-hinweis").hidden = true;
  textfenster.showModal();
}

// Klick neben ein Fenster schließt es ebenfalls
for (const fenster of document.querySelectorAll("dialog.textfenster")) {
  fenster.addEventListener("click", (ereignis) => {
    if (ereignis.target === fenster) fenster.close();
  });
}
