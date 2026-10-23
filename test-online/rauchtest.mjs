// Rauchtest der Online-Testversion – läuft im Deploy-Workflow nach jedem Deployment.
// Jede Prüfung erwartet ein bestimmtes Ergebnis; ein beliebiger Fehlerstatus zählt nicht als Erfolg.
//
// Umgebungsvariablen (vom Workflow gesetzt):
//   HAUPTADRESSE, DEPLOYMENT_URL  – stabile Testadresse und Adresse dieses Deployments
//   VERCEL_BYPASS                 – Geheimnis "Protection Bypass for Automation" (wird nie ausgegeben)
//   VERCEL_TOKEN, VERCEL_ORG_ID   – für die Dateiliste des Deployments (Vercel-API)
//   SUPABASE_URL, SUPABASE_SCHLUESSEL – Test-Projekt und öffentlicher Publishable Key
import { appendFileSync } from "node:fs";

const umgebung = (name) => {
  if (!process.env[name]) throw new Error(`Umgebungsvariable ${name} fehlt`);
  return process.env[name];
};
const HAUPTADRESSE = umgebung("HAUPTADRESSE").replace(/\/$/, "");
const DEPLOYMENT_URL = umgebung("DEPLOYMENT_URL").replace(/\/$/, "");
const BYPASS = umgebung("VERCEL_BYPASS");
const SUPABASE_URL = umgebung("SUPABASE_URL").replace(/\/$/, "");
const SUPABASE_SCHLUESSEL = umgebung("SUPABASE_SCHLUESSEL");

const ergebnisse = [];
const pruefe = (name, ok, info = "") => ergebnisse.push({ name, ok: Boolean(ok), info });
const SPIEL_MERKMALE = ["Escape Room – Raumauswahl", 'class="raum-liste"'];

// 1. Ohne Anmeldung: erwartet wird die Vercel-Zugriffssperre (Vercel Authentication), keine Spielinhalte.
//    Merkmale, festgehalten beim ersten Deployment (2026-10-23): HTTP 302 mit Weiterleitung auf
//    https://vercel.com/sso-api, Kopfzeile "server: Vercel" und Cookie "_vercel_sso_nonce".
//    Weiterleitungen werden nicht verfolgt.
async function pruefeSperre(adresse) {
  const antwort = await fetch(`${adresse}/`, { redirect: "manual" });
  const text = await antwort.text();
  const merkmale = {
    status302: antwort.status === 302,
    weiterleitungSso: (antwort.headers.get("location") ?? "").startsWith("https://vercel.com/sso-api"),
    serverVercel: /^vercel$/i.test(antwort.headers.get("server") ?? ""),
    ssoCookie: (antwort.headers.get("set-cookie") ?? "").includes("_vercel_sso_nonce="),
    keinSpiel: !SPIEL_MERKMALE.some((merkmal) => text.includes(merkmal)),
  };
  const fehlend = Object.entries(merkmale).filter(([, ok]) => !ok).map(([name]) => name);
  pruefe(`Ohne Anmeldung gesperrt: ${adresse}`, fehlend.length === 0,
    `HTTP ${antwort.status}${fehlend.length ? `, fehlende Merkmale: ${fehlend.join(", ")}` : ", Weiterleitung zu vercel.com/sso-api"}`);
}

// 2. Mit Automatisierungs-Bypass: die erwartete Website (HTML und öffentliche Dateien).
//    Weiterleitungen werden nicht verfolgt: Ein ungültiger Bypass zeigt sich so als Sperre (302)
//    und nicht als Statuscode der Vercel-Anmeldeseite.
const mitBypass = (pfad) =>
  fetch(`${HAUPTADRESSE}${pfad}`, { headers: { "x-vercel-protection-bypass": BYPASS }, redirect: "manual" });

async function pruefeWebsite() {
  const start = await mitBypass("/");
  const html = await start.text();
  const erwartet = ["<title>Escape Room – Raumauswahl</title>", 'class="raum-liste"', 'class="beitreten"', 'src="js/start.js"'];
  pruefe("Startseite liefert das erwartete HTML", start.status === 200 && erwartet.every((teil) => html.includes(teil)),
    `HTTP ${start.status}`);

  const raum = await mitBypass("/shared/raeume/arbeitszimmer.js");
  const raumText = await raum.text();
  pruefe("Öffentliche Raumdaten erreichbar, ohne Lösung", raum.status === 200 && raumText.includes('id: "arbeitszimmer"') && !raumText.includes('"417"'),
    `HTTP ${raum.status}`);

  // Die tatsächlichen geheimen Pfade und weitere Projektdateien dürfen nicht ausgeliefert werden
  for (const pfad of [
    "/supabase/functions/_shared/raeume/arbeitszimmer.geheim.js",
    "/supabase/functions/_shared/raeume/geheim.js",
    "/shared/raeume/geheim.js",
    "/server.js",
    "/package.json",
    "/supabase/config.toml",
  ]) {
    const antwort = await mitBypass(pfad);
    await antwort.arrayBuffer();
    pruefe(`Nicht erreichbar: ${pfad}`, antwort.status === 404 && antwort.headers.get("x-vercel-error") === "NOT_FOUND",
      `HTTP ${antwort.status}${antwort.headers.get("x-vercel-error") ? `, ${antwort.headers.get("x-vercel-error")}` : ""}`);
  }
}

// 3. Upload-Auswahl: Es wurden nur public/** und vercel.json hochgeladen (Vercel-API)
async function pruefeUpload() {
  const token = umgebung("VERCEL_TOKEN");
  const team = umgebung("VERCEL_ORG_ID");
  const kopf = { Authorization: `Bearer ${token}` };
  const deployment = await (await fetch(`https://api.vercel.com/v13/deployments/${new URL(DEPLOYMENT_URL).hostname}?teamId=${team}`, { headers: kopf })).json();
  const baum = await (await fetch(`https://api.vercel.com/v6/deployments/${deployment.id}/files?teamId=${team}`, { headers: kopf })).json();
  const pfade = [];
  const sammle = (knoten, praefix) => {
    for (const eintrag of knoten ?? []) {
      const pfad = praefix ? `${praefix}/${eintrag.name}` : eintrag.name;
      if (eintrag.type === "directory") sammle(eintrag.children, pfad);
      else pfade.push(pfad);
    }
  };
  sammle(Array.isArray(baum) ? baum : [], "");
  // Die API legt die hochgeladenen Quelldateien unter einen Wurzelordner "src/" (beim ersten Deployment festgestellt)
  const quellen = pfade.map((pfad) => pfad.replace(/^src\//, ""));
  const fremd = quellen.filter((pfad) => !(pfad === "vercel.json" || pfad.startsWith("public/")));
  pruefe("Hochgeladen wurden nur public/** und vercel.json", pfade.length > 0 && fremd.length === 0,
    `${pfade.length} Dateien${fremd.length ? `, unerwartet: ${fremd.slice(0, 5).join(", ")}` : ""}`);
}

// 4. Backend: gültiger Publishable Key, aber keine Nutzeranmeldung → Ablehnung wegen fehlender Anmeldung
async function pruefeBackend() {
  const antwort = await fetch(`${SUPABASE_URL}/functions/v1/sitzung-erstellen`, {
    method: "POST",
    headers: { apikey: SUPABASE_SCHLUESSEL, "Content-Type": "application/json" },
    body: JSON.stringify({ raumId: "arbeitszimmer" }),
  });
  const inhalt = await antwort.json().catch(() => ({}));
  const empfangen = inhalt.details?.received ?? {};
  pruefe("Backend lehnt Anfrage ohne Nutzeranmeldung ab",
    antwort.status === 401 && inhalt.source === "@supabase/server" && inhalt.details?.acceptedAuthModes?.includes("user")
      && empfangen.authorization === "absent" && empfangen.apikey === "publishable",
    `HTTP ${antwort.status}, ${inhalt.code ?? "?"} (authorization: ${empfangen.authorization ?? "?"}, apikey: ${empfangen.apikey ?? "?"})`);
}

// 5. CAPTCHA: Supabase lehnt Gastanmeldungen ohne bzw. mit ungültigem Token ab
async function pruefeCaptcha() {
  for (const [name, eingabe] of [
    ["ohne Token", {}],
    ["mit ungültigem Token", { gotrue_meta_security: { captcha_token: "ungueltiges-token" } }],
  ]) {
    const antwort = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: { apikey: SUPABASE_SCHLUESSEL, "Content-Type": "application/json" },
      body: JSON.stringify(eingabe),
    });
    const inhalt = await antwort.json().catch(() => ({}));
    pruefe(`Gastanmeldung ${name} abgelehnt (CAPTCHA)`, antwort.status === 400 && inhalt.error_code === "captcha_failed" && !inhalt.access_token,
      `HTTP ${antwort.status}, ${inhalt.error_code ?? "?"}`);
  }
}

for (const schritt of [() => pruefeSperre(HAUPTADRESSE), () => pruefeSperre(DEPLOYMENT_URL), pruefeWebsite, pruefeUpload, pruefeBackend, pruefeCaptcha]) {
  try {
    await schritt();
  } catch (fehler) {
    pruefe(`Prüfung abgebrochen: ${schritt.name || "Sperre"}`, false, String(fehler.message).replaceAll(BYPASS, "***"));
  }
}

const zeilen = ergebnisse.map((e) => `${e.ok ? "✅" : "❌"} ${e.name}${e.info ? ` — ${e.info}` : ""}`);
console.log(zeilen.join("\n"));
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Rauchtest\n\n${zeilen.map((z) => `- ${z}`).join("\n")}\n`);
}
const fehlgeschlagen = ergebnisse.filter((e) => !e.ok).length;
console.log(`${ergebnisse.length - fehlgeschlagen}/${ergebnisse.length} Prüfungen bestanden`);
process.exit(fehlgeschlagen ? 1 : 0);
