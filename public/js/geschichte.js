// Geschichte: zeigt Teile der Vorgeschichte eines Raums an (Intro, Outro, Ende bei Zeitablauf),
// spielt optionale Videos ab und inszeniert den optionalen Schreckmoment.

const ohneAnimation = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const LAUTSTAERKE = 0.6; // Schreckmoment nie in voller Lautstärke

// Schreibt eine Liste von Absätzen als <p>-Elemente in das Element.
export function schreibeAbsaetze(element, absaetze) {
  element.replaceChildren(
    ...absaetze.map((text) => {
      const absatz = document.createElement("p");
      absatz.textContent = text;
      return absatz;
    }),
  );
}

const pause = (ms) => new Promise((fertig) => setTimeout(fertig, ms));

// ---------- Videos ----------
// Der Text der Geschichte steht immer daneben (als Untertitel bzw. Ersatz).
// Endet das Video, wird übersprungen oder lädt es nicht, verschwindet es einfach wieder.

export function spieleVideo(bereich, pfad) {
  stoppeVideo(bereich);

  const video = document.createElement("video");
  video.className = "geschichte-video";
  video.src = pfad;
  video.playsInline = true; // auf dem Handy nicht automatisch im Vollbild

  const ueberspringen = erstelleKnopf("Überspringen ⏭");
  const abspielen = erstelleKnopf("▶ Abspielen");
  abspielen.hidden = true;

  const beenden = () => stoppeVideo(bereich);
  ueberspringen.addEventListener("click", beenden);
  video.addEventListener("ended", beenden);
  video.addEventListener("error", beenden); // Datei fehlt oder Format unbekannt → nur Text

  // Browser erlauben Ton nur nach einem Klick. Wird das Abspielen blockiert, gibt es einen Knopf dafür.
  const starte = () => video.play().catch((fehler) => {
    if (fehler.name === "NotAllowedError") abspielen.hidden = false;
  });
  abspielen.addEventListener("click", () => {
    abspielen.hidden = true;
    starte();
  });

  const leiste = document.createElement("div");
  leiste.className = "video-leiste";
  leiste.append(abspielen, ueberspringen);
  bereich.replaceChildren(video, leiste);
  bereich.hidden = false;
  starte();
}

export function stoppeVideo(bereich) {
  const video = bereich.querySelector("video");
  if (video) {
    video.pause();
    video.removeAttribute("src"); // gibt die Datei frei
    video.load();
  }
  bereich.replaceChildren();
  bereich.hidden = true;
}

function erstelleKnopf(text) {
  const knopf = document.createElement("button");
  knopf.className = "knopf";
  knopf.textContent = text;
  return knopf;
}

// ---------- Spannungsaufbau ----------

// Zeigt den Spannungstext Satz für Satz auf einer abgedunkelten Ebene (insgesamt etwa 5–6 Sekunden).
export async function spieleSpannung(ebene, spannung) {
  const textElement = ebene.querySelector(".schreck-spannung");
  textElement.replaceChildren();
  ebene.hidden = false;

  const saetze = spannung.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g) ?? [spannung];
  for (const satz of saetze) {
    const teil = document.createElement("span");
    teil.textContent = satz.trim() + " ";
    textElement.append(teil);
    // Kurze Sätze wie "Stille." bekommen trotzdem eine spürbare Pause
    await pause(Math.max(1000, satz.length * 30));
  }
  await pause(700);
}

// ---------- Schreckmoment ----------

// Ein einziges grelles Licht (kein Blinken), dazu der Ton. Danach wird die Ebene wieder ausgeblendet.
export async function spieleSchreck(ebene, schreck) {
  ebene.hidden = false;
  const licht = ebene.querySelector(".schreck-licht");
  licht.classList.remove("an", "sanft");
  void licht.offsetWidth; // erzwingt Neustart der Animation
  licht.classList.add("an");
  if (ohneAnimation) licht.classList.add("sanft");

  spieleSchreckton(schreck);
  await pause(ohneAnimation ? 1800 : 1300);
  ebene.hidden = true;
}

export function versteckeSchreckEbene(ebene) {
  ebene.hidden = true;
}

// ---------- Ton ----------

let audioKontext = null;
let schreckDatei = null;

// Muss bei einem Klick aufgerufen werden (z. B. "Raum betreten"): Danach darf der Browser
// den Schreck-Ton auch ohne direkten Klick abspielen – auch Safari.
export function gibTonFrei(schreck) {
  if (!schreck) return;
  if (schreck.sound) {
    schreckDatei = new Audio(schreck.sound);
    schreckDatei.volume = LAUTSTAERKE;
    schreckDatei.muted = true; // stummes Anspielen schaltet die Datei frei
    schreckDatei.play().then(() => {
      schreckDatei.pause();
      schreckDatei.currentTime = 0;
      schreckDatei.muted = false;
    }).catch(() => {});
  }
  const AudioKontext = window.AudioContext || window.webkitAudioContext;
  if (AudioKontext) {
    audioKontext ??= new AudioKontext();
    audioKontext.resume().catch(() => {});
  }
}

function spieleSchreckton(schreck) {
  if (schreckDatei) {
    schreckDatei.muted = false;
    schreckDatei.currentTime = 0;
    schreckDatei.play().catch(() => spieleErsatzton());
  } else {
    spieleErsatzton();
  }
}

// Eingebauter Ersatz, solange es keine Sounddatei gibt: dumpfer Schlag + Rauschen + kurzer schriller Akzent.
// Erzeugt mit der Web Audio API, es wird also keine Datei gebraucht.
function spieleErsatzton() {
  if (!audioKontext) return;
  const k = audioKontext;
  const jetzt = k.currentTime;
  const gesamt = k.createGain();
  gesamt.gain.value = LAUTSTAERKE;
  gesamt.connect(k.destination);

  // Dumpfer Schlag: tiefer Ton, der schnell abfällt (wie eine aufgerissene Tür)
  const schlag = k.createOscillator();
  const schlagLaut = k.createGain();
  schlag.frequency.setValueAtTime(110, jetzt);
  schlag.frequency.exponentialRampToValueAtTime(35, jetzt + 0.5);
  schlagLaut.gain.setValueAtTime(0.9, jetzt);
  schlagLaut.gain.exponentialRampToValueAtTime(0.001, jetzt + 0.6);
  schlag.connect(schlagLaut).connect(gesamt);
  schlag.start(jetzt);
  schlag.stop(jetzt + 0.6);

  // Rauschen: kurzer, harter Knall
  const laenge = Math.floor(k.sampleRate * 0.5);
  const puffer = k.createBuffer(1, laenge, k.sampleRate);
  const daten = puffer.getChannelData(0);
  for (let i = 0; i < laenge; i++) daten[i] = Math.random() * 2 - 1;
  const rauschen = k.createBufferSource();
  rauschen.buffer = puffer;
  const filter = k.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1800;
  const rauschenLaut = k.createGain();
  rauschenLaut.gain.setValueAtTime(0.7, jetzt);
  rauschenLaut.gain.exponentialRampToValueAtTime(0.001, jetzt + 0.45);
  rauschen.connect(filter).connect(rauschenLaut).connect(gesamt);
  rauschen.start(jetzt);

  // Schriller Akzent: zwei dicht beieinander liegende Töne klingen unangenehm schräg
  for (const frequenz of [880, 932]) {
    const ton = k.createOscillator();
    ton.type = "sawtooth";
    ton.frequency.value = frequenz;
    const tonLaut = k.createGain();
    tonLaut.gain.setValueAtTime(0.0001, jetzt);
    tonLaut.gain.exponentialRampToValueAtTime(0.12, jetzt + 0.03);
    tonLaut.gain.exponentialRampToValueAtTime(0.001, jetzt + 0.9);
    ton.connect(tonLaut).connect(gesamt);
    ton.start(jetzt);
    ton.stop(jetzt + 0.9);
  }
}
