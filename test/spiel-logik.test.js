// Tests für die Spiellogik. Ausführen mit: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import arbeitszimmer from "../public/shared/raeume/arbeitszimmer.js";
import { mitGeheimnissen } from "../supabase/functions/_shared/raeume/geheim.js";
import { erstelleSpielstand, verarbeiteAktion, restzeit, pruefeZeit } from "../public/shared/spiel-logik.js";

// Feste Zeitpunkte statt der echten Uhr, damit die Tests immer gleich ablaufen
const START = 1_000_000;
const SPAETER = START + 5_000; // 5 Sekunden nach dem Start
// Die Spiellogik bekommt den vollständigen Raum (öffentliche Daten plus Lösungen und Tipp-Texte)
const raum = mitGeheimnissen(arbeitszimmer);
const DAUER_MS = raum.dauerSekunden * 1000;

const starte = (spielstand, jetzt = START) => verarbeiteAktion(raum, spielstand, { typ: "start" }, jetzt);
// Für die meisten Tests: ein Spiel, das zum Zeitpunkt START begonnen hat
const neuesSpiel = () => starte(erstelleSpielstand(raum));
const untersuche = (spielstand, objekt, jetzt = SPAETER) =>
  verarbeiteAktion(raum, spielstand, { typ: "untersuche", objekt }, jetzt);
const probiere = (spielstand, eingabe, raetsel = "tuer", jetzt = SPAETER) =>
  verarbeiteAktion(raum, spielstand, { typ: "loese", raetsel, eingabe }, jetzt);

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

// ---------- Rätsel (Zahlenschloss an der Tür) ----------

test("Neues Spiel läuft und hat keine Fehlversuche", () => {
  const start = neuesSpiel();
  assert.equal(start.status, "laeuft");
  assert.equal(start.fehlversuche, 0);
});

test("Falscher Code zählt einen Fehlversuch, das Spiel läuft weiter", () => {
  const spielstand = probiere(neuesSpiel(), "123");
  assert.equal(spielstand.fehlversuche, 1);
  assert.equal(spielstand.status, "laeuft");
  assert.deepEqual(spielstand.geloesteRaetsel, []);
});

test("Richtiger Code am Ausgang öffnet das Schloss und gewinnt das Spiel", () => {
  const spielstand = probiere(neuesSpiel(), "417");
  assert.deepEqual(spielstand.geloesteRaetsel, ["tuer"]);
  assert.equal(spielstand.status, "gewonnen");
});

test("Unbekanntes Rätsel ändert nichts", () => {
  const start = neuesSpiel();
  assert.equal(probiere(start, "417", "tresor"), start);
});

test("Ein Rätsel mit unbekanntem Rätseltyp ändert nichts", () => {
  const kaputt = { ...raum, raetsel: { tuer: { ...raum.raetsel.tuer, typ: "gibt-es-nicht" } } };
  const start = verarbeiteAktion(kaputt, erstelleSpielstand(kaputt), { typ: "start" }, START);
  assert.equal(verarbeiteAktion(kaputt, start, { typ: "loese", raetsel: "tuer", eingabe: "417" }, SPAETER), start);
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

// ---------- Kein Neustart (erneutes Spielen = neue Sitzung) ----------

test("Einen Neustart innerhalb eines Spiels gibt es nicht", () => {
  const verloren = pruefeZeit(untersuche(neuesSpiel(), "kalender"), START + DAUER_MS);
  assert.equal(verarbeiteAktion(raum, verloren, { typ: "neustart" }, START + DAUER_MS + 10_000), verloren);
});

test("Ein beendetes Spiel ohne Start hat die volle Zeit und nimmt keine Aktionen an", () => {
  const beendet = { ...erstelleSpielstand(raum), status: "beendet", endzeit: START };
  assert.equal(restzeit(beendet, START + 99_000), DAUER_MS);
  assert.equal(starte(beendet), beendet);
  assert.equal(untersuche(beendet, "kalender"), beendet);
});

// ---------- Vor dem Start (Intro) ----------

test("Ein neues Spiel wartet im Status bereit, ohne Startzeit", () => {
  const bereit = erstelleSpielstand(raum);
  assert.equal(bereit.status, "bereit");
  assert.equal(bereit.startzeit, null);
});

test("Vor dem Start steht die volle Zeit zur Verfügung und läuft nicht ab", () => {
  const bereit = erstelleSpielstand(raum);
  assert.equal(restzeit(bereit, START + DAUER_MS * 5), DAUER_MS);
  assert.equal(pruefeZeit(bereit, START + DAUER_MS * 5), bereit);
});

test("Vor dem Start wirken andere Aktionen nicht", () => {
  const bereit = erstelleSpielstand(raum);
  assert.equal(untersuche(bereit, "kalender"), bereit);
  assert.equal(probiere(bereit, "417"), bereit);
  assert.equal(verarbeiteAktion(raum, bereit, { typ: "tipp", nummer: 1 }, START), bereit);
});

test("Start setzt Status und Startzeit, ein zweiter Start ändert nichts", () => {
  const gestartet = starte(erstelleSpielstand(raum), START);
  assert.equal(gestartet.status, "laeuft");
  assert.equal(gestartet.startzeit, START);
  assert.equal(starte(gestartet, SPAETER), gestartet);
});

// ---------- Tipps ----------
const STRAFE_MS = raum.strafeProTippSekunden * 1000;
// Fordert den nächsten Tipp an – so, wie es die Anzeige tut (Nummer = bisher geholte Tipps + 1)
const tipp = (spielstand, jetzt = SPAETER, nummer = spielstand.freigegebeneTipps.length + 1) =>
  verarbeiteAktion(raum, spielstand, { typ: "tipp", nummer }, jetzt);

test("Ein Tipp wird mit seinem Text freigegeben und kostet Zeit", () => {
  const spielstand = tipp(neuesSpiel());
  assert.deepEqual(spielstand.freigegebeneTipps, [raum.geheim.tipps[0]]);
  assert.equal(restzeit(spielstand, START), DAUER_MS - STRAFE_MS);
});

test("Fordern zwei Personen gleichzeitig denselben Tipp an, zählt er nur einmal", () => {
  const vorher = neuesSpiel();
  const ersteAnfrage = tipp(vorher, SPAETER, 1);
  const zweiteAnfrage = tipp(ersteAnfrage, SPAETER, 1); // dieselbe Nummer, kam etwas später an
  assert.equal(zweiteAnfrage, ersteAnfrage);
  assert.equal(zweiteAnfrage.freigegebeneTipps.length, 1);
  assert.equal(restzeit(zweiteAnfrage, START), DAUER_MS - STRAFE_MS);
});

test("Ein Tipp mit falscher oder fehlender Nummer ändert nichts", () => {
  const start = neuesSpiel();
  assert.equal(tipp(start, SPAETER, 2), start);
  assert.equal(tipp(start, SPAETER, 0), start);
  assert.equal(verarbeiteAktion(raum, start, { typ: "tipp" }, SPAETER), start);
});

test("Es gibt nicht mehr Tipps, als der Raum hat", () => {
  let spielstand = neuesSpiel();
  for (let i = 0; i < raum.geheim.tipps.length; i++) spielstand = tipp(spielstand);
  assert.deepEqual(spielstand.freigegebeneTipps, raum.geheim.tipps);
  assert.equal(tipp(spielstand), spielstand);
});

test("Frisst ein Tipp die restliche Zeit auf, ist das Spiel verloren", () => {
  const kurzVorSchluss = START + DAUER_MS - STRAFE_MS / 2;
  const spielstand = tipp(neuesSpiel(), kurzVorSchluss);
  assert.equal(spielstand.status, "verloren");
  assert.equal(restzeit(spielstand, kurzVorSchluss), 0);
});

test("Nach dem Spielende gibt es keine Tipps mehr", () => {
  const gewonnen = probiere(neuesSpiel(), "417");
  assert.equal(tipp(gewonnen), gewonnen);
});
