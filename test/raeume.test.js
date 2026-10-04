// Tests für die Raumliste: Vorgaben, die jeder Raum erfüllen muss. Ausführen mit: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { raeume, SCHWIERIGKEITEN, findeRaum } from "../shared/raeume/index.js";

test("Jeder Raum hat einen gültigen Schwierigkeitsgrad", () => {
  for (const raum of raeume) {
    assert.ok(SCHWIERIGKEITEN[raum.schwierigkeit], `Raum "${raum.id}" hat keine gültige Schwierigkeit`);
  }
});

test("Spätere Räume sind nicht leichter als frühere", () => {
  for (let i = 1; i < raeume.length; i++) {
    assert.ok(
      raeume[i].schwierigkeit >= raeume[i - 1].schwierigkeit,
      `Raum "${raeume[i].id}" ist leichter als "${raeume[i - 1].id}"`,
    );
  }
});

test("Jeder Raum hat eine eindeutige ID und eine Kurzbeschreibung", () => {
  const ids = raeume.map((raum) => raum.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const raum of raeume) assert.ok(raum.kurzbeschreibung, `Raum "${raum.id}" hat keine Kurzbeschreibung`);
});

test("Räume lassen sich über ihre ID finden", () => {
  assert.equal(findeRaum("arbeitszimmer").id, "arbeitszimmer");
  assert.equal(findeRaum("gibt-es-nicht"), undefined);
});

// Jeder Raum erzählt seine eigene Geschichte: Intro, Outro und ein Ende bei Zeitablauf
const istTextliste = (wert) => Array.isArray(wert) && wert.length > 0 && wert.every((t) => typeof t === "string" && t);

test("Jeder Raum hat eine vollständige Geschichte (Intro, Outro, Verloren-Text)", () => {
  for (const raum of raeume) {
    const g = raum.geschichte;
    assert.ok(g?.intro?.titel, `Raum "${raum.id}": Intro-Titel fehlt`);
    assert.ok(istTextliste(g.intro.text), `Raum "${raum.id}": Intro-Text fehlt`);
    assert.ok(istTextliste(g.gewonnen?.text), `Raum "${raum.id}": Outro-Text (gewonnen) fehlt`);
    assert.ok(istTextliste(g.verloren?.text), `Raum "${raum.id}": Verloren-Text fehlt`);
  }
});

test("Jeder Raum entscheidet ausdrücklich über den Schreckmoment (schreck: null oder { sound })", () => {
  for (const raum of raeume) {
    const verloren = raum.geschichte.verloren;
    assert.ok(Object.hasOwn(verloren, "schreck"), `Raum "${raum.id}": Feld "schreck" fehlt (null = kein Schreck)`);
    if (verloren.schreck !== null) {
      assert.ok(Object.hasOwn(verloren.schreck, "sound"), `Raum "${raum.id}": schreck.sound fehlt (null = Ersatzton)`);
    }
  }
});

test("Videos sind entweder nicht gesetzt (null) oder ein Dateipfad", () => {
  for (const raum of raeume) {
    for (const teil of ["intro", "gewonnen", "verloren"]) {
      const video = raum.geschichte[teil].video;
      assert.ok(video == null || (typeof video === "string" && video), `Raum "${raum.id}": ${teil}.video ungültig`);
    }
  }
});
