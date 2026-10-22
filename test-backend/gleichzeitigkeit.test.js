// Backend-Tests: gleichzeitige Aktionen, Beitritte und Spielstart.
// Voraussetzung: lokales Supabase läuft (npm run backend:start). Ausführen mit: npm run test:backend
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { admin, neuerGast, erstelleSitzung, beitreten, aktion, sitzungInDb, mitgliederInDb } from "./hilfe.js";

// Sitzung mit erstellender Person A und Mitglied B, bereits gestartet
async function laufendeSitzung() {
  const [a, b] = [await neuerGast(), await neuerGast()];
  const sitzung = await erstelleSitzung(a);
  await beitreten(b, sitzung.beitrittscode);
  await aktion(a, sitzung.id, { typ: "start" });
  return { a, b, sitzung };
}

test("A und B fordern gleichzeitig denselben Tipp an → genau ein Tipp und eine Strafe", async () => {
  const { a, b, sitzung } = await laufendeSitzung();
  await Promise.all([
    aktion(a, sitzung.id, { typ: "tipp", nummer: 1 }),
    aktion(b, sitzung.id, { typ: "tipp", nummer: 1 }),
  ]);
  const { zustand } = await sitzungInDb(sitzung.id);
  assert.equal(zustand.freigegebeneTipps.length, 1);
  assert.equal(zustand.strafSekunden, 60);
});

test("Gleichzeitige verschiedene Aktionen überschreiben sich nicht", async () => {
  const { a, b, sitzung } = await laufendeSitzung();
  const antworten = await Promise.all([
    aktion(a, sitzung.id, { typ: "untersuche", objekt: "kalender" }),
    aktion(b, sitzung.id, { typ: "untersuche", objekt: "rahmenecke" }),
    aktion(a, sitzung.id, { typ: "untersuche", objekt: "notiz" }),
    aktion(b, sitzung.id, { typ: "untersuche", objekt: "blauer-zettel" }),
  ]);
  assert.ok(antworten.every((antwort) => antwort.status === 200), JSON.stringify(antworten.map((x) => x.daten)));
  const { zustand } = await sitzungInDb(sitzung.id);
  assert.deepEqual([...zustand.gefundeneSpuren].sort(), ["blau", "gruen", "reihenfolge", "rot"]);
});

test("Dieselbe Aktion zweimal gleichzeitig gesendet → wirkt einmal", async () => {
  const { a, sitzung } = await laufendeSitzung();
  const aktionId = randomUUID();
  const falsch = { typ: "loese", raetsel: "tuer", eingabe: "000" };
  await Promise.all([aktion(a, sitzung.id, falsch, aktionId), aktion(a, sitzung.id, falsch, aktionId)]);
  assert.equal((await sitzungInDb(sitzung.id)).zustand.fehlversuche, 1);
});

test("Fünf gleichzeitige Beitritte zu einer Sitzung mit einer Person → genau vier Mitglieder", async () => {
  const a = await neuerGast();
  const sitzung = await erstelleSitzung(a);
  const gaeste = await Promise.all(Array.from({ length: 5 }, neuerGast));
  const antworten = await Promise.all(gaeste.map((gast) => beitreten(gast, sitzung.beitrittscode)));

  assert.equal(antworten.filter((x) => x.status === 200).length, 3);
  assert.equal(antworten.filter((x) => x.daten?.fehler === "voll").length, 2);
  assert.equal((await mitgliederInDb(sitzung.id)).length, 4);
});

test("Gleichzeitiger Beitritt und Spielstart: niemand kommt nach dem Start neu hinein", async () => {
  const ergebnisse = { beigetreten: 0, abgewiesen: 0 };

  for (let runde = 0; runde < 8; runde++) {
    const [a, b] = [await neuerGast(), await neuerGast()];
    const sitzung = await erstelleSitzung(a);
    const [start, beitritt] = await Promise.all([
      aktion(a, sitzung.id, { typ: "start" }),
      beitreten(b, sitzung.beitrittscode),
    ]);

    assert.equal(start.status, 200);
    assert.equal((await sitzungInDb(sitzung.id)).zustand.status, "laeuft");
    const istMitglied = (await mitgliederInDb(sitzung.id)).find((m) => m.user_id === b.id);

    if (beitritt.status === 200) {
      ergebnisse.beigetreten++;
      // Der Beitritt muss vor dem Start gespeichert worden sein (beide Zeitpunkte setzt die Datenbank)
      const { data: startEintrag } = await admin
        .from("aktionen").select("erstellt_am").eq("sitzung_id", sitzung.id).eq("typ", "start").single();
      assert.ok(istMitglied);
      assert.ok(new Date(istMitglied.beigetreten_am) < new Date(startEintrag.erstellt_am),
        `Runde ${runde}: Beitritt nach dem Start gespeichert`);
    } else {
      ergebnisse.abgewiesen++;
      assert.equal(beitritt.status, 409);
      assert.equal(beitritt.daten.fehler, "schon_gestartet");
      assert.equal(istMitglied, undefined);
    }
  }
  console.log(`Gleichzeitiger Beitritt und Start: ${JSON.stringify(ergebnisse)}`);
});
