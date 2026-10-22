// Spiellogik: die Regeln des Spiels als reine Funktionen.
// Sie bekommen den Raum, den bisherigen Spielstand und eine Aktion und geben den neuen Spielstand zurück.
// Kein Zugriff auf Browser oder Bildschirm – deshalb kann später auch der Server genau diese Datei nutzen.
//
// Der Spielstand wird nie verändert, sondern immer neu erzeugt. Ändert eine Aktion nichts,
// kommt derselbe Spielstand zurück – so lässt sich leicht prüfen, ob sich etwas getan hat.
//
// Zeiten: "jetzt" ist immer ein Zeitpunkt in Millisekunden (wie Date.now()). Die Logik fragt die Uhr
// nie selbst ab, sondern bekommt die Zeit übergeben – im Mehrspieler-Modus gibt sie der Server vor.
//
// "raum" ist der vollständige Raum: öffentliche Raumdaten plus "geheim" (Lösungen, Tipp-Texte),
// zusammengesetzt mit mitGeheimnissen() aus shared/raeume/geheim.js.
import { RAETSELTYPEN } from "./raetsel/index.js";

// Ein neues Spiel wartet zuerst im Status "bereit" (Intro wird gelesen), die Zeit läuft erst nach "start".
export function erstelleSpielstand(raum) {
  return {
    raumId: raum.id,
    status: "bereit", // "bereit", "laeuft", "gewonnen" oder "verloren"
    startzeit: null, // wird beim Start gesetzt
    dauerSekunden: raum.dauerSekunden,
    strafSekunden: 0, // Zeitabzug durch Tipps
    endzeit: null, // Zeitpunkt des Spielendes – danach bleibt die Restzeit stehen
    freigegebeneTipps: [], // Texte der bisher geholten Tipps (die Anzeige kennt sonst keine Tipps)
    gefundeneSpuren: [], // Namen der Spuren in der Reihenfolge, in der sie gefunden wurden
    geloesteRaetsel: [],
    fehlversuche: 0, // falsche Lösungsversuche (die Anzeige lässt dann z. B. das Schloss wackeln)
  };
}

// Aktionen:
//   { typ: "start" }                                                  → Raum betreten, die Zeit läuft
//   { typ: "untersuche", objekt: "<objekt-id>" }                     → ein Objekt wurde angeklickt
//   { typ: "loese", raetsel: "<rätsel>", eingabe: "<z. B. ziffern>" } → Lösung eines Rätsels probieren
//   { typ: "tipp", nummer: <n> }                                      → Tipp Nummer n holen (kostet Zeit)
//   { typ: "neustart" }                                               → neues Spiel, startet sofort (ohne Intro)
export function verarbeiteAktion(raum, spielstand, aktion, jetzt) {
  if (aktion.typ === "neustart") return starte(erstelleSpielstand(raum), jetzt);
  if (aktion.typ === "start") return spielstand.status === "bereit" ? starte(spielstand, jetzt) : spielstand;

  // Ist die Zeit inzwischen abgelaufen, zählt die Aktion nicht mehr
  spielstand = pruefeZeit(spielstand, jetzt);
  if (spielstand.status !== "laeuft") return spielstand;

  switch (aktion.typ) {
    case "untersuche":
      return untersuche(raum, spielstand, aktion.objekt);
    case "loese":
      return loese(raum, spielstand, aktion.raetsel, aktion.eingabe, jetzt);
    case "tipp":
      return holeTipp(raum, spielstand, aktion.nummer, jetzt);
    default:
      return spielstand;
  }
}

function starte(spielstand, jetzt) {
  return { ...spielstand, status: "laeuft", startzeit: jetzt };
}

// Verbleibende Zeit in Millisekunden (nie negativ). Vor dem Start ist es die volle Zeit,
// nach dem Spielende bleibt sie stehen.
export function restzeit(spielstand, jetzt) {
  if (spielstand.status === "bereit") return (spielstand.dauerSekunden - spielstand.strafSekunden) * 1000;
  const ende = spielende(spielstand);
  return Math.max(0, ende - (spielstand.endzeit ?? jetzt));
}

// Beendet das Spiel als verloren, sobald die Zeit abgelaufen ist.
// Wird regelmäßig aufgerufen (auch ohne Klick), damit das Spiel pünktlich endet.
export function pruefeZeit(spielstand, jetzt) {
  if (spielstand.status !== "laeuft" || restzeit(spielstand, jetzt) > 0) return spielstand;
  return { ...spielstand, status: "verloren", endzeit: spielende(spielstand) };
}

// Zeitpunkt, zu dem die Zeit abläuft – jeder Tipp zieht sie nach vorne
function spielende(spielstand) {
  return spielstand.startzeit + (spielstand.dauerSekunden - spielstand.strafSekunden) * 1000;
}

// "nummer" ist der Tipp, den die Person angefordert hat (1 = erster Tipp). Es zählt nur der nächste
// noch nicht geholte Tipp – fordern zwei Personen gleichzeitig denselben an, gibt es ihn nur einmal.
function holeTipp(raum, spielstand, nummer, jetzt) {
  const naechster = spielstand.freigegebeneTipps.length + 1;
  if (nummer !== naechster || naechster > raum.geheim.tipps.length) return spielstand;

  const neu = {
    ...spielstand,
    freigegebeneTipps: [...spielstand.freigegebeneTipps, raum.geheim.tipps[naechster - 1]],
    strafSekunden: spielstand.strafSekunden + raum.strafeProTippSekunden,
  };
  // Frisst die Strafe die restliche Zeit auf, ist das Spiel sofort vorbei
  return pruefeZeit(neu, jetzt);
}

function untersuche(raum, spielstand, objektId) {
  const objekt = findeObjekt(raum, objektId);
  if (objekt?.aktion?.typ !== "findeSpur") return spielstand;

  const spur = objekt.aktion.spur;
  if (!raum.spuren[spur] || spielstand.gefundeneSpuren.includes(spur)) return spielstand;

  return { ...spielstand, gefundeneSpuren: [...spielstand.gefundeneSpuren, spur] };
}

// Ob die Eingabe stimmt, entscheidet der Rätseltyp (siehe shared/raetsel/).
function loese(raum, spielstand, raetselName, eingabe, jetzt) {
  const typ = RAETSELTYPEN[raum.raetsel?.[raetselName]?.typ];
  if (!typ || spielstand.geloesteRaetsel.includes(raetselName)) return spielstand;

  if (!typ.pruefe(eingabe, raum.geheim.loesungen[raetselName])) {
    return { ...spielstand, fehlversuche: spielstand.fehlversuche + 1 };
  }

  const neu = {
    ...spielstand,
    geloesteRaetsel: [...spielstand.geloesteRaetsel, raetselName],
  };
  if (raetselName === raum.ausgang) {
    neu.status = "gewonnen";
    neu.endzeit = jetzt;
  }
  return neu;
}

// Sucht ein Objekt in allen Szenen des Raums.
export function findeObjekt(raum, objektId) {
  for (const szene of Object.values(raum.szenen)) {
    const objekt = szene.objekte.find((o) => o.id === objektId);
    if (objekt) return objekt;
  }
  return undefined;
}
