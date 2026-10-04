// Anzeige: zeichnet Szenen und Objekte auf die Bühne, zoomt zwischen Szenen und zeigt Texte an.
// Enthält keine Spielregeln – nur Darstellung.
import { restzeit } from "/shared/spiel-logik.js";

const szeneElement = document.querySelector(".szene");
const hintergrund = document.querySelector(".szene-hintergrund");
const zurueckKnopf = document.querySelector(".zurueck-knopf");
const textfenster = document.querySelector(".beschreibung");
const notizbuch = document.querySelector(".notizbuch");
const notizbuchKnopf = document.querySelector(".notizbuch-knopf");
const schlossFenster = document.querySelector(".schloss-fenster");
const endeFenster = document.querySelector(".ende-fenster");
const timer = document.querySelector(".timer");
const hilfe = document.querySelector(".hilfe");
const hilfeKnopf = document.querySelector(".hilfe-knopf");

// Zuletzt angezeigter Spielstand – um Änderungen zu erkennen (neue Spur, Fehlversuch, Tipp, Spielende)
let aktuellerSpielstand = null;
let gefundeneSpuren = [];
let fehlversuche = 0;
let genutzteTipps = 0;
let status = "laeuft";

// Wird beim Klick auf "Öffnen" mit dem eingestellten Code aufgerufen (siehe zeigeSchloss)
let beiCodeVersuch = null;

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
  aktuellerSpielstand = spielstand;
  zeichneTimer();

  const neue = spielstand.gefundeneSpuren.filter((spur) => !gefundeneSpuren.includes(spur));
  gefundeneSpuren = spielstand.gefundeneSpuren;

  markiereGefundene();
  zeichneNotizbuch(raum);
  if (neue.length > 0) meldeNeueSpur();

  if (spielstand.fehlversuche > fehlversuche) meldeFalschenCode();
  fehlversuche = spielstand.fehlversuche;

  zeichneHilfe(raum, spielstand);
  if (spielstand.genutzteTipps > genutzteTipps) zeigeStrafe();
  genutzteTipps = spielstand.genutzteTipps;

  if (spielstand.status !== status) {
    const tippText = `Tipps genutzt: ${spielstand.genutzteTipps}`;
    if (spielstand.status === "gewonnen") {
      zeigeEnde("🔓", "Geschafft!",
        "Mit einem leisen Klicken springt das Schloss auf. Du bist aus dem Arbeitszimmer entkommen!",
        `Restzeit: ${formatiereZeit(restzeit(spielstand, Date.now()))} · ${tippText}`);
    } else if (spielstand.status === "verloren") {
      zeigeEnde("⌛", "Zeit abgelaufen",
        "Draußen schlägt eine Uhr. Die Tür bleibt verschlossen – und das Rätsel um den Professor ungelöst.",
        `Spuren gefunden: ${spielstand.gefundeneSpuren.length} von ${Object.keys(raum.spuren).length} · ${tippText}`);
    } else {
      endeFenster.close(); // neues Spiel hat begonnen
    }
  }
  status = spielstand.status;
}

// ---------- Timer ----------

// Die Restzeit wird bei jedem Aufruf aus dem Spielstand neu berechnet (keine eigene Zählvariable).
function zeichneTimer() {
  if (!aktuellerSpielstand) return;
  const millisekunden = restzeit(aktuellerSpielstand, Date.now());
  timer.querySelector(".timer-zeit").textContent = formatiereZeit(millisekunden);
  // In der letzten Minute wird der Timer rot
  timer.classList.toggle("knapp", millisekunden <= 60_000 && aktuellerSpielstand.status === "laeuft");
}

setInterval(zeichneTimer, 250);

// Millisekunden → "mm:ss" (angebrochene Sekunden werden aufgerundet, damit 00:00 erst am Ende erscheint)
function formatiereZeit(millisekunden) {
  const sekunden = Math.ceil(millisekunden / 1000);
  const minuten = Math.floor(sekunden / 60);
  return `${String(minuten).padStart(2, "0")}:${String(sekunden % 60).padStart(2, "0")}`;
}

// Kurzes rotes Aufblitzen des Timers, wenn ein Tipp Zeit gekostet hat
function zeigeStrafe() {
  timer.classList.remove("strafe");
  void timer.offsetWidth; // erzwingt Neustart der Animation
  timer.classList.add("strafe");
}

// ---------- Hilfe ----------

function zeichneHilfe(raum, spielstand) {
  const strafe = raum.strafeProTippSekunden;
  const strafeText = strafe % 60 === 0 ? `${strafe / 60} Min.` : `${strafe} Sek.`;
  const anzahl = spielstand.genutzteTipps;

  hilfe.querySelector(".hilfe-info").textContent = anzahl < raum.tipps.length
    ? `Jeder neue Tipp kostet ${strafeText} Spielzeit. Bereits erhaltene Tipps kannst du hier jederzeit kostenlos nachlesen.`
    : "Du hast alle Tipps erhalten.";

  hilfe.querySelector(".hilfe-liste").replaceChildren(
    ...raum.tipps.slice(0, anzahl).map((text) => {
      const eintrag = document.createElement("li");
      eintrag.textContent = text;
      return eintrag;
    }),
  );

  const anfordern = hilfe.querySelector(".hilfe-anfordern");
  anfordern.hidden = anzahl >= raum.tipps.length || spielstand.status !== "laeuft";
  anfordern.textContent = `Tipp ${anzahl + 1} von ${raum.tipps.length} holen (−${strafeText})`;
}

hilfeKnopf.addEventListener("click", () => hilfe.showModal());

export function beimTippAnfordern(callback) {
  hilfe.querySelector(".hilfe-anfordern").addEventListener("click", callback);
}

// ---------- Zahlenschloss ----------

// Öffnet das Schloss-Fenster. "beiVersuch" wird mit dem eingestellten Code (Text) aufgerufen.
export function zeigeSchloss(schloss, beiVersuch) {
  beiCodeVersuch = beiVersuch;
  schlossFenster.querySelector(".textfenster-titel").textContent = schloss.name;
  schlossFenster.querySelector(".textfenster-text").textContent = schloss.text;
  schlossFenster.querySelector(".schloss-meldung").textContent = "";
  const raeder = Array.from({ length: schloss.code.length }, erstelleRad);
  schlossFenster.querySelector(".schloss-raeder").replaceChildren(...raeder);
  schlossFenster.showModal();
}

// Ein Rädchen mit Ziffer 0–9, ▲ zählt hoch, ▼ zählt runter (nach 9 kommt wieder 0)
function erstelleRad() {
  const rad = document.createElement("div");
  rad.className = "rad";
  rad.innerHTML = `
    <button class="rad-knopf" aria-label="Ziffer erhöhen">▲</button>
    <span class="ziffer">0</span>
    <button class="rad-knopf" aria-label="Ziffer verringern">▼</button>`;
  const [hoch, runter] = rad.querySelectorAll("button");
  const ziffer = rad.querySelector(".ziffer");
  const aendere = (schritt) => {
    ziffer.textContent = (Number(ziffer.textContent) + schritt + 10) % 10;
    schlossFenster.querySelector(".schloss-meldung").textContent = "";
  };
  hoch.addEventListener("click", () => aendere(1));
  runter.addEventListener("click", () => aendere(-1));
  return rad;
}

schlossFenster.querySelector(".schloss-oeffnen").addEventListener("click", () => {
  const code = [...schlossFenster.querySelectorAll(".ziffer")].map((z) => z.textContent).join("");
  beiCodeVersuch?.(code);
});

function meldeFalschenCode() {
  if (!schlossFenster.open) return;
  schlossFenster.querySelector(".schloss-meldung").textContent = "Das Schloss rührt sich nicht.";
  const raeder = schlossFenster.querySelector(".schloss-raeder");
  raeder.classList.remove("wackeln");
  void raeder.offsetWidth; // erzwingt Neustart der Animation
  raeder.classList.add("wackeln");
}

// ---------- Spielende ----------

function zeigeEnde(symbol, titel, text, statistik) {
  document.querySelectorAll("dialog[open]").forEach((fenster) => fenster.close());
  endeFenster.querySelector(".ende-symbol").textContent = symbol;
  endeFenster.querySelector(".ende-titel").textContent = titel;
  endeFenster.querySelector(".ende-text").textContent = text;
  endeFenster.querySelector(".ende-statistik").textContent = statistik;
  endeFenster.showModal();
}

// Das Ende-Fenster lässt sich nicht mit Esc schließen – nur über "Nochmal spielen"
endeFenster.addEventListener("cancel", (ereignis) => ereignis.preventDefault());

export function beimNeustart(callback) {
  endeFenster.querySelector(".ende-neustart").addEventListener("click", callback);
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

// Klick neben ein Fenster schließt es ebenfalls. Ein Klick auf den Innenrand des Fensters
// meldet ebenfalls das Fenster als Ziel – deshalb zusätzlich prüfen, ob er wirklich außerhalb lag.
for (const fenster of document.querySelectorAll("dialog.textfenster")) {
  fenster.addEventListener("click", (ereignis) => {
    if (ereignis.target !== fenster) return;
    const rahmen = fenster.getBoundingClientRect();
    const ausserhalb =
      ereignis.clientX < rahmen.left || ereignis.clientX > rahmen.right ||
      ereignis.clientY < rahmen.top || ereignis.clientY > rahmen.bottom;
    if (ausserhalb) fenster.close();
  });
}
