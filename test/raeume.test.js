// Tests für die Raumliste: Vorgaben, die jeder Raum erfüllen muss. Ausführen mit: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { raeume, SCHWIERIGKEITEN, findeRaum } from "../shared/raeume/index.js";
import { geheimnisseVon } from "../shared/raeume/geheim.js";
import { RAETSELTYPEN } from "../shared/raetsel/index.js";

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

// ---------- Version, Rätsel und Geheimnisse ----------

test("Jeder Raum hat eine Raumversion (ganze Zahl ab 1)", () => {
  for (const raum of raeume) {
    assert.ok(Number.isInteger(raum.version) && raum.version >= 1, `Raum "${raum.id}": version fehlt oder ungültig`);
  }
});

test("Jedes Rätsel hat einen bekannten Rätseltyp und eine Lösung; der Ausgang ist ein Rätsel", () => {
  for (const raum of raeume) {
    const geheim = geheimnisseVon(raum.id);
    assert.ok(geheim, `Raum "${raum.id}": geheime Daten fehlen (shared/raeume/geheim.js)`);
    for (const [name, raetsel] of Object.entries(raum.raetsel)) {
      assert.ok(RAETSELTYPEN[raetsel.typ], `Raum "${raum.id}": Rätsel "${name}" hat unbekannten Typ "${raetsel.typ}"`);
      assert.ok(Object.hasOwn(geheim.loesungen, name), `Raum "${raum.id}": Lösung für Rätsel "${name}" fehlt`);
    }
    assert.ok(raum.raetsel[raum.ausgang], `Raum "${raum.id}": Ausgang "${raum.ausgang}" ist kein Rätsel`);
  }
});

test("Jede Rätsel-Aktion eines Objekts verweist auf ein vorhandenes Rätsel", () => {
  for (const raum of raeume) {
    for (const szene of Object.values(raum.szenen)) {
      for (const objekt of szene.objekte) {
        if (objekt.aktion?.typ === "raetsel") {
          assert.ok(raum.raetsel[objekt.aktion.raetsel], `Raum "${raum.id}": Rätsel "${objekt.aktion.raetsel}" fehlt`);
        }
      }
    }
  }
});

test("Zahlenschlösser: Anzahl der Rädchen passt zur Lösung, die Lösung besteht nur aus Ziffern", () => {
  for (const raum of raeume) {
    for (const [name, raetsel] of Object.entries(raum.raetsel)) {
      if (raetsel.typ !== "zahlenschloss") continue;
      const loesung = geheimnisseVon(raum.id).loesungen[name];
      assert.match(loesung, /^\d+$/, `Raum "${raum.id}": Lösung von "${name}" ist keine Ziffernfolge`);
      assert.equal(raetsel.stellen, loesung.length, `Raum "${raum.id}": "${name}".stellen passt nicht zur Lösung`);
    }
  }
});

test("Die Anzahl der Tipps in den Raumdaten passt zu den geheimen Tipp-Texten", () => {
  for (const raum of raeume) {
    const tipps = geheimnisseVon(raum.id).tipps;
    assert.ok(tipps.length > 0, `Raum "${raum.id}": keine Tipps`);
    assert.equal(raum.anzahlTipps, tipps.length, `Raum "${raum.id}": anzahlTipps passt nicht`);
  }
});

// Alle Schlüssel eines verschachtelten Objekts sammeln
const alleSchluessel = (wert) =>
  wert && typeof wert === "object"
    ? Object.entries(wert).flatMap(([schluessel, inhalt]) => [schluessel, ...alleSchluessel(inhalt)])
    : [];

test("Öffentliche Raumdaten enthalten keine Lösungen und keine Tipp-Texte", () => {
  for (const raum of raeume) {
    const schluessel = alleSchluessel(raum);
    for (const verboten of ["geheim", "loesungen", "tipps", "code"]) {
      assert.ok(!schluessel.includes(verboten), `Raum "${raum.id}": öffentliches Feld "${verboten}" gefunden`);
    }
    const text = JSON.stringify(raum);
    const geheim = geheimnisseVon(raum.id);
    for (const loesung of Object.values(geheim.loesungen)) {
      assert.ok(!text.includes(JSON.stringify(loesung)), `Raum "${raum.id}": eine Lösung steht in den öffentlichen Daten`);
    }
    for (const tipp of geheim.tipps) {
      assert.ok(!text.includes(tipp), `Raum "${raum.id}": ein Tipp-Text steht in den öffentlichen Daten`);
    }
  }
});
