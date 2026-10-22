// Backend-Tests: Zugriffsrechte (RLS), gesperrte Datenbankfunktionen, Atomarität und Realtime.
// Voraussetzung: lokales Supabase läuft (npm run backend:start). Ausführen mit: npm run test:backend
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { admin, neuerGast, erstelleSitzung, beitreten, aktion, sitzungInDb, warte } from "./hilfe.js";

test("Browser dürfen die schreibenden Datenbankfunktionen nicht direkt aufrufen", async () => {
  const a = await neuerGast();
  const sitzung = await erstelleSitzung(a);
  const aufrufe = {
    erstelle_sitzung: { p_raum_id: "arbeitszimmer", p_raum_version: 1, p_erstellt_von: a.id, p_zustand: {} },
    tritt_bei: { p_code: sitzung.beitrittscode, p_user: a.id, p_max: 99 },
    speichere_aktion: {
      p_sitzung: sitzung.id, p_aktion_id: randomUUID(), p_user: a.id, p_typ: "start", p_daten: {},
      p_erwartete_version: sitzung.version, p_neuer_zustand: { status: "gewonnen" },
    },
    speichere_zustand: { p_sitzung: sitzung.id, p_erwartete_version: sitzung.version, p_neuer_zustand: { status: "gewonnen" } },
  };
  for (const [funktion, eingabe] of Object.entries(aufrufe)) {
    const { error } = await a.client.rpc(funktion, eingabe);
    assert.ok(error, `${funktion} ließ sich aus dem Browser aufrufen`);
  }
  const inDb = await sitzungInDb(sitzung.id);
  assert.equal(inDb.version, sitzung.version);
  assert.equal(inDb.zustand.status, "bereit");
});

test("Browser dürfen Tabellen nicht beschreiben und Aktionen nicht lesen", async () => {
  const a = await neuerGast();
  const sitzung = await erstelleSitzung(a);

  const aendern = await a.client.from("sitzungen").update({ zustand: { status: "gewonnen" } }).eq("id", sitzung.id).select();
  assert.ok(aendern.error || aendern.data.length === 0);
  const einfuegen = await a.client.from("sitzung_mitglieder").insert({ sitzung_id: sitzung.id, user_id: a.id });
  assert.ok(einfuegen.error);
  const loeschen = await a.client.from("sitzungen").delete().eq("id", sitzung.id).select();
  assert.ok(loeschen.error || loeschen.data.length === 0);
  const aktionenLesen = await a.client.from("aktionen").select("*");
  assert.ok(aktionenLesen.error || aktionenLesen.data.length === 0);

  assert.equal((await sitzungInDb(sitzung.id)).zustand.status, "bereit");
});

test("Mitglieder lesen ihre Sitzung, Fremde sehen sie nicht", async () => {
  const [a, fremd] = [await neuerGast(), await neuerGast()];
  const sitzung = await erstelleSitzung(a);
  assert.equal((await a.client.from("sitzungen").select("id").eq("id", sitzung.id)).data.length, 1);
  assert.equal((await fremd.client.from("sitzungen").select("id").eq("id", sitzung.id)).data.length, 0);
  assert.equal((await fremd.client.from("sitzung_mitglieder").select("*").eq("sitzung_id", sitzung.id)).data.length, 0);
});

test("Versionskonflikt: nichts wird gespeichert, auch kein Aktionseintrag", async () => {
  const a = await neuerGast();
  const sitzung = await erstelleSitzung(a);
  const aktionId = randomUUID();
  const { data } = await admin.rpc("speichere_aktion", {
    p_sitzung: sitzung.id, p_aktion_id: aktionId, p_user: a.id, p_typ: "start", p_daten: {},
    p_erwartete_version: sitzung.version + 5, p_neuer_zustand: { status: "laeuft" },
  });
  assert.equal(data.ergebnis, "versionskonflikt");
  assert.equal((await sitzungInDb(sitzung.id)).version, sitzung.version);
  assert.equal((await admin.from("aktionen").select("*").eq("aktion_id", aktionId)).data.length, 0);
});

test("Scheitert der Aktionseintrag, wird auch die Änderung am Spielstand zurückgenommen", async () => {
  const a = await neuerGast();
  const sitzung = await erstelleSitzung(a);
  // typ = null verletzt eine Pflichtangabe der Tabelle "aktionen" – erst NACH der Änderung am Spielstand
  const { error } = await admin.rpc("speichere_aktion", {
    p_sitzung: sitzung.id, p_aktion_id: randomUUID(), p_user: a.id, p_typ: null, p_daten: {},
    p_erwartete_version: sitzung.version, p_neuer_zustand: { status: "laeuft" },
  });
  assert.ok(error);
  const inDb = await sitzungInDb(sitzung.id);
  assert.equal(inDb.version, sitzung.version);
  assert.equal(inDb.zustand.status, "bereit");
});

// Abonniert Änderungen an einer Sitzung und sammelt die empfangenen Spielstände.
// Wichtig: "SUBSCRIBED" heißt nur, dass der Kanal steht. Datenbankänderungen kommen erst an,
// wenn Realtime zusätzlich "Subscribed to PostgreSQL" meldet – erst danach darf man sich darauf verlassen.
async function abonniere(gast, sitzungId) {
  const empfangen = [];
  await gast.client.realtime.setAuth(gast.token);
  const kanal = gast.client.channel(`test-${randomUUID()}`);
  await new Promise((fertig, fehler) => {
    setTimeout(() => fehler(new Error("Realtime-Abonnement nicht rechtzeitig aktiv")), 10_000);
    kanal
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "sitzungen", filter: `id=eq.${sitzungId}` },
        (nachricht) => empfangen.push(nachricht.new.zustand))
      .on("system", {}, (nachricht) => {
        if (nachricht.extension === "postgres_changes" && nachricht.status === "ok") fertig();
      })
      .subscribe((status, grund) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") fehler(grund ?? new Error(status));
      });
  });
  return { empfangen, beende: () => gast.client.removeAllChannels() };
}

test("Realtime: Mitglieder empfangen bestätigte Änderungen, Fremde nichts", async () => {
  const [a, b, fremd] = [await neuerGast(), await neuerGast(), await neuerGast()];
  const sitzung = await erstelleSitzung(a);
  await beitreten(b, sitzung.beitrittscode);

  const beiA = await abonniere(a, sitzung.id);
  const beiFremd = await abonniere(fremd, sitzung.id);

  await aktion(a, sitzung.id, { typ: "start" });
  await aktion(b, sitzung.id, { typ: "untersuche", objekt: "kalender" });

  const hatSpur = () => beiA.empfangen.some((zustand) => zustand.gefundeneSpuren.includes("gruen"));
  for (let i = 0; i < 50 && !hatSpur(); i++) await warte(100);
  await warte(500); // der fremden Person Zeit geben, falls doch etwas durchrutschen würde
  await beiA.beende();
  await beiFremd.beende();

  assert.ok(hatSpur(), "Mitglied hat die Änderung nicht empfangen");
  assert.equal(beiFremd.empfangen.length, 0, "Fremde Person hat Änderungen empfangen");
});
