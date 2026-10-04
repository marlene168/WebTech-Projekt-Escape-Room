// Tests für die Spiellogik. Ausführen mit: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import raum from "../shared/raeume/arbeitszimmer.js";
import { erstelleSpielstand, verarbeiteAktion, restzeit, pruefeZeit } from "../shared/spiel-logik.js";

// Feste Zeitpunkte statt der echten Uhr, damit die Tests immer gleich ablaufen
const START = 1_000_000;
const SPAETER = START + 5_000; // 5 Sekunden nach dem Start
const DAUER_MS = raum.dauerSekunden * 1000;

const neuesSpiel = () => erstelleSpielstand(raum, START);
const untersuche = (spielstand, objekt, jetzt = SPAETER) =>
  verarbeiteAktion(raum, spielstand, { typ: "untersuche", objekt }, jetzt);
const probiere = (spielstand, code, schloss = "tuer", jetzt = SPAETER) =>
  verarbeiteAktion(raum, spielstand, { typ: "probiereCode", schloss, code }, jetzt);

// ---------- Spuren ----------

test("Neues Spiel beginnt ohne gefundene Spuren", () => {
  assert.deepEqual(neuesSpiel().gefundeneSpuren, []);
});

test("Untersuchen eines Objekts mit Spur trägt die Spur ein", () => {
  assert.deepEqual(untersuche(neuesSpiel(), "kalender").gefundeneSpuren, ["gruen"]);
});

test("Spuren erscheinen in der Reihenfolge, in der sie gefunden wurden", () => {
  let spielstand = neuesSpiel();
  spielstand = untersuche(spielstand, "rahmenecke");
  spielstand = untersuche(spielstand, "kalender");
  assert.deepEqual(spielstand.gefundeneSpuren, ["rot", "gruen"]);
});

test("Dieselbe Spur wird nur einmal eingetragen", () => {
  const einmal = untersuche(neuesSpiel(), "kalender");
  assert.equal(untersuche(einmal, "kalender"), einmal);
});

test("Objekte ohne Spur und unbekannte Objekte ändern nichts", () => {
  const start = neuesSpiel();
  assert.equal(untersuche(start, "regal"), start);
  assert.equal(untersuche(start, "gibt-es-nicht"), start);
});

test("Unbekannte Aktionen ändern nichts", () => {
  const start = neuesSpiel();
  assert.equal(verarbeiteAktion(raum, start, { typ: "zaubern" }, SPAETER), start);
});

test("Der alte Spielstand bleibt unverändert", () => {
  const start = neuesSpiel();
  untersuche(start, "kalender");
  assert.deepEqual(start.gefundeneSpuren, []);
});

test("Jede Spur-Aktion im Raum verweist auf eine vorhandene Spur", () => {
  for (const szene of Object.values(raum.szenen)) {
    for (const objekt of szene.objekte) {
      if (objekt.aktion?.typ === "findeSpur") {
        assert.ok(raum.spuren[objekt.aktion.spur], `Spur "${objekt.aktion.spur}" fehlt (Objekt ${objekt.id})`);
      }
    }
  }
});

// ---------- Zahlenschloss ----------

test("Neues Spiel läuft und hat keine Fehlversuche", () => {
  const start = neuesSpiel();
  assert.equal(start.status, "laeuft");
  assert.equal(start.fehlversuche, 0);
});

test("Falscher Code zählt einen Fehlversuch, das Spiel läuft weiter", () => {
  const spielstand = probiere(neuesSpiel(), "123");
  assert.equal(spielstand.fehlversuche, 1);
  assert.equal(spielstand.status, "laeuft");
  assert.deepEqual(spielstand.geoeffneteSchloesser, []);
});

test("Richtiger Code am Ausgang öffnet das Schloss und gewinnt das Spiel", () => {
  const spielstand = probiere(neuesSpiel(), "417");
  assert.deepEqual(spielstand.geoeffneteSchloesser, ["tuer"]);
  assert.equal(spielstand.status, "gewonnen");
});

test("Unbekanntes Schloss ändert nichts", () => {
  const start = neuesSpiel();
  assert.equal(probiere(start, "417", "tresor"), start);
});

test("Nach dem Gewinnen ändern Aktionen nichts mehr", () => {
  const gewonnen = probiere(neuesSpiel(), "417");
  assert.equal(probiere(gewonnen, "000"), gewonnen);
  assert.equal(untersuche(gewonnen, "kalender"), gewonnen);
});

test("Der Code muss als Text mit allen Ziffern stimmen", () => {
  const start = neuesSpiel();
  assert.equal(probiere(start, 417).status, "laeuft");
  assert.equal(probiere(start, "41").status, "laeuft");
});

// ---------- Timer ----------

test("Zu Beginn steht die volle Spielzeit zur Verfügung", () => {
  assert.equal(restzeit(neuesSpiel(), START), DAUER_MS);
});

test("Die Restzeit sinkt mit der Zeit und wird nie negativ", () => {
  const start = neuesSpiel();
  assert.equal(restzeit(start, START + 60_000), DAUER_MS - 60_000);
  assert.equal(restzeit(start, START + DAUER_MS + 99_999), 0);
});

test("Vor Ablauf der Zeit ändert pruefeZeit nichts", () => {
  const start = neuesSpiel();
  assert.equal(pruefeZeit(start, START + DAUER_MS - 1), start);
});

test("Nach Ablauf der Zeit ist das Spiel verloren", () => {
  const spielstand = pruefeZeit(neuesSpiel(), START + DAUER_MS);
  assert.equal(spielstand.status, "verloren");
  assert.equal(restzeit(spielstand, START + DAUER_MS + 5_000), 0);
});

test("Auch der richtige Code hilft nach Ablauf der Zeit nicht mehr", () => {
  const spielstand = probiere(neuesSpiel(), "417", "tuer", START + DAUER_MS + 1);
  assert.equal(spielstand.status, "verloren");
});

test("Nach dem Gewinnen bleibt die Restzeit stehen", () => {
  const gewonnen = probiere(neuesSpiel(), "417", "tuer", START + 100_000);
  assert.equal(restzeit(gewonnen, START + 300_000), DAUER_MS - 100_000);
  assert.equal(pruefeZeit(gewonnen, START + DAUER_MS * 2), gewonnen);
});

// ---------- Neustart ----------

test("Neustart setzt alles zurück und startet die Zeit neu", () => {
  let spielstand = untersuche(neuesSpiel(), "kalender");
  spielstand = pruefeZeit(spielstand, START + DAUER_MS);
  const neustartZeit = START + DAUER_MS + 10_000;
  const neu = verarbeiteAktion(raum, spielstand, { typ: "neustart" }, neustartZeit);
  assert.deepEqual(neu, erstelleSpielstand(raum, neustartZeit));
});
