// Tests für die Spiellogik. Ausführen mit: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import raum from "../shared/raeume/arbeitszimmer.js";
import { erstelleSpielstand, verarbeiteAktion } from "../shared/spiel-logik.js";

const untersuche = (spielstand, objekt) =>
  verarbeiteAktion(raum, spielstand, { typ: "untersuche", objekt });

test("Neues Spiel beginnt ohne gefundene Spuren", () => {
  assert.deepEqual(erstelleSpielstand(raum).gefundeneSpuren, []);
});

test("Untersuchen eines Objekts mit Spur trägt die Spur ein", () => {
  const spielstand = untersuche(erstelleSpielstand(raum), "kalender");
  assert.deepEqual(spielstand.gefundeneSpuren, ["gruen"]);
});

test("Spuren erscheinen in der Reihenfolge, in der sie gefunden wurden", () => {
  let spielstand = erstelleSpielstand(raum);
  spielstand = untersuche(spielstand, "rahmenecke");
  spielstand = untersuche(spielstand, "kalender");
  assert.deepEqual(spielstand.gefundeneSpuren, ["rot", "gruen"]);
});

test("Dieselbe Spur wird nur einmal eingetragen", () => {
  const einmal = untersuche(erstelleSpielstand(raum), "kalender");
  const zweimal = untersuche(einmal, "kalender");
  assert.equal(zweimal, einmal);
});

test("Objekte ohne Spur und unbekannte Objekte ändern nichts", () => {
  const start = erstelleSpielstand(raum);
  assert.equal(untersuche(start, "regal"), start);
  assert.equal(untersuche(start, "gibt-es-nicht"), start);
});

test("Unbekannte Aktionen ändern nichts", () => {
  const start = erstelleSpielstand(raum);
  assert.equal(verarbeiteAktion(raum, start, { typ: "zaubern" }), start);
});

test("Der alte Spielstand bleibt unverändert", () => {
  const start = erstelleSpielstand(raum);
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
