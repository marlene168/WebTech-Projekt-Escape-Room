// Backend-Tests: Sitzungen erstellen, beitreten, laden, Rechte, Zeit und Raumversion.
// Voraussetzung: lokales Supabase läuft (npm run backend:start). Ausführen mit: npm run test:backend
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  API_URL, admin, neuerGast, rufe, erstelleSitzung, beitreten, laden, aktion, sitzungInDb, mitgliederInDb,
} from "./hilfe.js";

test("Sitzung erstellen: Code, Status bereit, Raumversion, erstellende Person ist Mitglied", async () => {
  const a = await neuerGast();
  const sitzung = await erstelleSitzung(a);
  assert.match(sitzung.beitrittscode, /^[A-HJ-NP-Z2-9]{6}$/);
  assert.equal(sitzung.zustand.status, "bereit");
  assert.equal(sitzung.raum_version, 1);
  assert.equal(sitzung.erstellt_von, a.id);
  assert.deepEqual((await mitgliederInDb(sitzung.id)).map((m) => m.user_id), [a.id]);
});

test("Unbekannter Raum wird abgelehnt, ohne gültige Anmeldung geht nichts", async () => {
  const a = await neuerGast();
  assert.equal((await rufe(a, "sitzung-erstellen", { raumId: "gibt-es-nicht" })).status, 400);
  assert.equal((await rufe({ token: "kein-gueltiges-token" }, "sitzung-erstellen", { raumId: "arbeitszimmer" })).status, 401);
});

test("Beitritt per Code (Groß-/Kleinschreibung egal); unbekannter Code wird abgelehnt", async () => {
  const [a, b] = [await neuerGast(), await neuerGast()];
  const sitzung = await erstelleSitzung(a);
  const antwort = await beitreten(b, sitzung.beitrittscode.toLowerCase());
  assert.equal(antwort.status, 200);
  assert.equal(antwort.daten.sitzung.id, sitzung.id);
  assert.equal(typeof antwort.daten.serverzeit, "number");
  assert.equal((await mitgliederInDb(sitzung.id)).length, 2);
  assert.equal((await beitreten(b, "ZZZZZZ")).status, 404);
});

test("Laden per Sitzungs-ID nur für Mitglieder", async () => {
  const [a, b, fremd] = [await neuerGast(), await neuerGast(), await neuerGast()];
  const sitzung = await erstelleSitzung(a);
  await beitreten(b, sitzung.beitrittscode);
  assert.equal((await laden(b, sitzung.id)).status, 200);
  assert.equal((await laden(fremd, sitzung.id)).status, 403);
  assert.equal((await laden(fremd, randomUUID())).status, 403); // unbekannt sieht genauso aus
  assert.equal((await aktion(fremd, sitzung.id, { typ: "untersuche", objekt: "kalender" })).status, 403);
});

test("Nur die erstellende Person startet; Tipps dürfen alle Mitglieder holen", async () => {
  const [a, b] = [await neuerGast(), await neuerGast()];
  const sitzung = await erstelleSitzung(a);
  await beitreten(b, sitzung.beitrittscode);

  const versuchB = await aktion(b, sitzung.id, { typ: "start" });
  assert.equal(versuchB.status, 403);
  assert.equal(versuchB.daten.fehler, "nur_ersteller_startet");

  assert.equal((await aktion(a, sitzung.id, { typ: "start" })).daten.sitzung.zustand.status, "laeuft");
  const tipp = await aktion(b, sitzung.id, { typ: "tipp", nummer: 1 });
  assert.equal(tipp.daten.sitzung.zustand.freigegebeneTipps.length, 1);
});

test("Nach dem Start: neue Personen werden abgewiesen, Mitglieder steigen wieder ein, die Zeit läuft weiter", async () => {
  const [a, b, spaet] = [await neuerGast(), await neuerGast(), await neuerGast()];
  const sitzung = await erstelleSitzung(a);
  await beitreten(b, sitzung.beitrittscode);
  const gestartet = (await aktion(a, sitzung.id, { typ: "start" })).daten.sitzung;

  const neu = await beitreten(spaet, sitzung.beitrittscode);
  assert.equal(neu.status, 409);
  assert.equal(neu.daten.fehler, "schon_gestartet");
  assert.equal((await mitgliederInDb(sitzung.id)).length, 2);

  // Wiedereinstieg nach Neuladen (per ID) oder per Code: derselbe Spielstand, dieselbe Startzeit
  for (const antwort of [await laden(b, sitzung.id), await beitreten(b, sitzung.beitrittscode)]) {
    assert.equal(antwort.status, 200);
    assert.equal(antwort.daten.sitzung.zustand.status, "laeuft");
    assert.equal(antwort.daten.sitzung.zustand.startzeit, gestartet.zustand.startzeit);
  }
});

test("Höchstens vier Personen pro Sitzung", async () => {
  const a = await neuerGast();
  const sitzung = await erstelleSitzung(a);
  for (let i = 0; i < 3; i++) assert.equal((await beitreten(await neuerGast(), sitzung.beitrittscode)).status, 200);
  const fuenfte = await beitreten(await neuerGast(), sitzung.beitrittscode);
  assert.equal(fuenfte.status, 409);
  assert.equal(fuenfte.daten.fehler, "voll");
  assert.equal((await mitgliederInDb(sitzung.id)).length, 4);
});

test("Zeitablauf erkennt der Server beim Laden und speichert ihn", async () => {
  const a = await neuerGast();
  const sitzung = await erstelleSitzung(a);
  const gestartet = (await aktion(a, sitzung.id, { typ: "start" })).daten.sitzung;

  // Startzeit in die Vergangenheit legen, als wären die 10 Minuten längst vorbei (am Backend vorbei)
  const zustand = { ...gestartet.zustand, startzeit: Date.now() - (gestartet.zustand.dauerSekunden + 5) * 1000 };
  await admin.from("sitzungen").update({ zustand }).eq("id", sitzung.id);

  const antwort = await laden(a, sitzung.id);
  assert.equal(antwort.daten.sitzung.zustand.status, "verloren");
  const inDb = await sitzungInDb(sitzung.id);
  assert.equal(inDb.zustand.status, "verloren");
  assert.equal(inDb.version, gestartet.version + 1);
});

test("Eine Sitzung mit veralteter Raumversion nimmt keine Aktionen mehr an", async () => {
  const a = await neuerGast();
  const sitzung = await erstelleSitzung(a);
  await aktion(a, sitzung.id, { typ: "start" });
  await admin.from("sitzungen").update({ raum_version: 0 }).eq("id", sitzung.id);

  const antwort = await aktion(a, sitzung.id, { typ: "untersuche", objekt: "kalender" });
  assert.equal(antwort.status, 409);
  assert.equal(antwort.daten.fehler, "raum_veraltet");
});

test("Doppelt gesendete Aktion (gleiche aktionId) wirkt nur einmal", async () => {
  const a = await neuerGast();
  const sitzung = await erstelleSitzung(a);
  await aktion(a, sitzung.id, { typ: "start" });

  const aktionId = randomUUID();
  const falsch = { typ: "loese", raetsel: "tuer", eingabe: "000" };
  await aktion(a, sitzung.id, falsch, aktionId);
  const nochmal = await aktion(a, sitzung.id, falsch, aktionId);
  assert.equal(nochmal.daten.sitzung.zustand.fehlversuche, 1);

  const { data } = await admin.from("aktionen").select("aktion_id").eq("sitzung_id", sitzung.id).eq("aktion_id", aktionId);
  assert.equal(data.length, 1);
});

test("Der richtige Code gewinnt das Spiel; die Antwort enthält keine Lösungen", async () => {
  const a = await neuerGast();
  const sitzung = await erstelleSitzung(a);
  await aktion(a, sitzung.id, { typ: "start" });
  const antwort = await aktion(a, sitzung.id, { typ: "loese", raetsel: "tuer", eingabe: "417" });
  assert.equal(antwort.daten.sitzung.zustand.status, "gewonnen");
  assert.ok(!JSON.stringify(antwort.daten).includes('"417"'));
  assert.ok(API_URL); // nur lokal (siehe hilfe.js)
});

test("Verlässt die erstellende Person die Sitzung vor dem Start, ist sie für alle beendet", async () => {
  const [a, b, spaet] = [await neuerGast(), await neuerGast(), await neuerGast()];
  const sitzung = await erstelleSitzung(a);
  await beitreten(b, sitzung.beitrittscode);

  assert.equal((await aktion(a, sitzung.id, { typ: "verlassen" })).daten.sitzung.zustand.status, "beendet");
  assert.equal((await laden(b, sitzung.id)).daten.sitzung.zustand.status, "beendet"); // B sieht die Meldung
  assert.equal((await aktion(a, sitzung.id, { typ: "start" })).daten.sitzung.zustand.status, "beendet");
  assert.equal((await beitreten(spaet, sitzung.beitrittscode)).status, 409);
});

test("Verlässt die erstellende Person die Sitzung während des Spiels, ist sie beendet; andere können nicht beenden", async () => {
  const [a, b] = [await neuerGast(), await neuerGast()];
  const sitzung = await erstelleSitzung(a);
  await beitreten(b, sitzung.beitrittscode);
  await aktion(a, sitzung.id, { typ: "start" });

  const versuchB = await aktion(b, sitzung.id, { typ: "verlassen" });
  assert.equal(versuchB.status, 403);
  assert.equal(versuchB.daten.fehler, "nur_ersteller_beendet");

  assert.equal((await aktion(a, sitzung.id, { typ: "verlassen" })).daten.sitzung.zustand.status, "beendet");
  const nachher = await aktion(b, sitzung.id, { typ: "untersuche", objekt: "kalender" });
  assert.deepEqual(nachher.daten.sitzung.zustand.gefundeneSpuren, []);
});
