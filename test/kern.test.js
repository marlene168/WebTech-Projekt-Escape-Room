// Tests für den Kern der Edge Functions (supabase/functions/_shared/kern.js). Ausführen mit: npm test
// Ohne Datenbank: geprüft werden die Regeln, nach denen das Backend Aktionen annimmt oder ablehnt.
import { test } from "node:test";
import assert from "node:assert/strict";
import { bearbeiteAktion, vollstaendigerRaum, neuerSpielstand, mitServerzeit, MAX_MITGLIEDER } from "../supabase/functions/_shared/kern.js";

const START = 1_000_000;
const raum = vollstaendigerRaum("arbeitszimmer");
const ERSTELLER = "ersteller";
const MITGLIED = "mitglied";

// Eine Sitzungszeile, wie sie in der Datenbank steht
const sitzung = (zustand = neuerSpielstand(raum), raumVersion = raum.version) =>
  ({ raum_version: raumVersion, erstellt_von: ERSTELLER, zustand });
const bearbeite = (s, aktion, userId = ERSTELLER, jetzt = START) =>
  bearbeiteAktion({ raum, sitzung: s, userId, aktion, jetzt });
const gestartet = () => bearbeite(sitzung(), { typ: "start" }).zustand;

test("Der vollständige Raum enthält die geheimen Daten, unbekannte Räume gibt es nicht", () => {
  assert.equal(raum.geheim.loesungen.tuer, "417");
  assert.equal(vollstaendigerRaum("gibt-es-nicht"), undefined);
});

test("Höchstens vier Personen pro Sitzung", () => {
  assert.equal(MAX_MITGLIEDER, 4);
});

test("Nur die erstellende Person darf starten", () => {
  assert.deepEqual(bearbeite(sitzung(), { typ: "start" }, MITGLIED), { abgelehnt: "nur_ersteller_startet" });
  assert.equal(gestartet().status, "laeuft");
});

test("Alle Mitglieder dürfen Tipps holen", () => {
  const ergebnis = bearbeite(sitzung(gestartet()), { typ: "tipp", nummer: 1 }, MITGLIED, START + 1000);
  assert.equal(ergebnis.zustand.freigegebeneTipps.length, 1);
});

test("Unbekannte oder unvollständige Aktionen werden abgelehnt, auch \"neustart\"", () => {
  for (const aktion of [undefined, {}, { typ: "neustart" }, { typ: "zaubern" }, { typ: "loese", raetsel: "tuer" },
    { typ: "tipp", nummer: "1" }, { typ: "untersuche", objekt: "x".repeat(101) }]) {
    assert.deepEqual(bearbeite(sitzung(gestartet()), aktion), { abgelehnt: "ungueltige_aktion" }, JSON.stringify(aktion));
  }
});

test("Zusätzliche Felder einer Aktion werden nicht übernommen", () => {
  const ergebnis = bearbeite(sitzung(gestartet()), { typ: "untersuche", objekt: "kalender", status: "gewonnen" });
  assert.deepEqual(ergebnis.aktion, { typ: "untersuche", objekt: "kalender" });
  assert.equal(ergebnis.zustand.status, "laeuft");
});

test("Eine Sitzung mit veralteter Raumversion nimmt keine Aktionen mehr an", () => {
  assert.deepEqual(bearbeite(sitzung(gestartet(), raum.version - 1), { typ: "untersuche", objekt: "kalender" }),
    { abgelehnt: "raum_veraltet" });
});

test("Der Server rechnet mit seiner Zeit: Nach Ablauf zählt auch der richtige Code nicht", () => {
  const nachAblauf = START + raum.dauerSekunden * 1000 + 1;
  const ergebnis = bearbeite(sitzung(gestartet()), { typ: "loese", raetsel: "tuer", eingabe: "417" }, ERSTELLER, nachAblauf);
  assert.equal(ergebnis.zustand.status, "verloren");
});

test("mitServerzeit erkennt den Zeitablauf und ändert sonst nichts", () => {
  const laeuft = gestartet();
  assert.equal(mitServerzeit(laeuft, START + 1000), laeuft);
  assert.equal(mitServerzeit(laeuft, START + raum.dauerSekunden * 1000).status, "verloren");
});

test("Ändert eine Aktion nichts, kommt derselbe Zustand zurück (dann speichert das Backend nichts)", () => {
  const s = sitzung(gestartet());
  assert.equal(bearbeite(s, { typ: "untersuche", objekt: "regal" }, ERSTELLER, START + 1000).zustand, s.zustand);
  assert.equal(bearbeite(s, { typ: "tipp", nummer: 2 }, ERSTELLER, START + 1000).zustand, s.zustand);
});

// ---------- Verlassen durch die erstellende Person ----------

test("Verlässt die erstellende Person die Sitzung vor dem Start, ist sie beendet", () => {
  const ergebnis = bearbeite(sitzung(), { typ: "verlassen" });
  assert.equal(ergebnis.zustand.status, "beendet");
  assert.equal(ergebnis.zustand.endzeit, START);
});

test("Verlässt die erstellende Person die Sitzung während des Spiels, ist sie beendet und die Zeit bleibt stehen", () => {
  const ergebnis = bearbeite(sitzung(gestartet()), { typ: "verlassen" }, ERSTELLER, START + 30_000);
  assert.equal(ergebnis.zustand.status, "beendet");
  assert.equal(ergebnis.zustand.endzeit, START + 30_000);
});

test("Nur die erstellende Person kann die Sitzung beenden", () => {
  assert.deepEqual(bearbeite(sitzung(gestartet()), { typ: "verlassen" }, MITGLIED), { abgelehnt: "nur_ersteller_beendet" });
});

test("Eine schon beendete oder entschiedene Sitzung ändert sich durch Verlassen nicht mehr", () => {
  const beendet = bearbeite(sitzung(), { typ: "verlassen" }).zustand;
  assert.equal(bearbeite(sitzung(beendet), { typ: "verlassen" }).zustand, beendet);
  const gewonnen = bearbeite(sitzung(gestartet()), { typ: "loese", raetsel: "tuer", eingabe: "417" }, ERSTELLER, START + 1000).zustand;
  assert.equal(bearbeite(sitzung(gewonnen), { typ: "verlassen" }).zustand, gewonnen);
});

test("In einer beendeten Sitzung wirken keine Aktionen mehr", () => {
  const beendet = bearbeite(sitzung(), { typ: "verlassen" }).zustand;
  assert.equal(bearbeite(sitzung(beendet), { typ: "start" }).zustand, beendet);
});
