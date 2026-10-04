// Spiellogik: die Regeln des Spiels als reine Funktionen.
// Sie bekommen den Raum, den bisherigen Spielstand und eine Aktion und geben den neuen Spielstand zurück.
// Kein Zugriff auf Browser oder Bildschirm – deshalb kann später auch der Server genau diese Datei nutzen.
//
// Der Spielstand wird nie verändert, sondern immer neu erzeugt. Ändert eine Aktion nichts,
// kommt derselbe Spielstand zurück – so lässt sich leicht prüfen, ob sich etwas getan hat.
//
// Zeiten: "jetzt" ist immer ein Zeitpunkt in Millisekunden (wie Date.now()). Die Logik fragt die Uhr
// nie selbst ab, sondern bekommt die Zeit übergeben – im Mehrspieler-Modus gibt sie der Server vor.

export function erstelleSpielstand(raum, jetzt) {
  return {
    raumId: raum.id,
    status: "laeuft", // "laeuft", "gewonnen" oder "verloren"
    startzeit: jetzt,
    dauerSekunden: raum.dauerSekunden,
    strafSekunden: 0, // Zeitabzug durch Tipps
    endzeit: null, // Zeitpunkt des Spielendes – danach bleibt die Restzeit stehen
    genutzteTipps: 0,
    gefundeneSpuren: [], // Namen der Spuren in der Reihenfolge, in der sie gefunden wurden
    geoeffneteSchloesser: [],
    fehlversuche: 0, // falsch eingegebene Codes (die Anzeige lässt dann das Schloss wackeln)
  };
}

// Aktionen:
//   { typ: "untersuche", objekt: "<objekt-id>" }                   → ein Objekt wurde angeklickt
//   { typ: "probiereCode", schloss: "<schloss>", code: "<ziffern>" } → Code an einem Schloss eingeben
//   { typ: "tipp" }                                                 → nächsten Tipp holen (kostet Zeit)
//   { typ: "neustart" }                                             → neues Spiel, alles auf Anfang
export function verarbeiteAktion(raum, spielstand, aktion, jetzt) {
  if (aktion.typ === "neustart") return erstelleSpielstand(raum, jetzt);

  // Ist die Zeit inzwischen abgelaufen, zählt die Aktion nicht mehr
  spielstand = pruefeZeit(spielstand, jetzt);
  if (spielstand.status !== "laeuft") return spielstand;

  switch (aktion.typ) {
    case "untersuche":
      return untersuche(raum, spielstand, aktion.objekt);
    case "probiereCode":
      return probiereCode(raum, spielstand, aktion.schloss, aktion.code, jetzt);
    case "tipp":
      return holeTipp(raum, spielstand, jetzt);
    default:
      return spielstand;
  }
}

// Verbleibende Zeit in Millisekunden (nie negativ). Nach dem Spielende bleibt sie stehen.
export function restzeit(spielstand, jetzt) {
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

function holeTipp(raum, spielstand, jetzt) {
  if (spielstand.genutzteTipps >= raum.tipps.length) return spielstand;

  const neu = {
    ...spielstand,
    genutzteTipps: spielstand.genutzteTipps + 1,
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

function probiereCode(raum, spielstand, schlossName, code, jetzt) {
  const schloss = raum.schloesser?.[schlossName];
  if (!schloss || spielstand.geoeffneteSchloesser.includes(schlossName)) return spielstand;

  if (code !== schloss.code) {
    return { ...spielstand, fehlversuche: spielstand.fehlversuche + 1 };
  }

  const neu = {
    ...spielstand,
    geoeffneteSchloesser: [...spielstand.geoeffneteSchloesser, schlossName],
  };
  if (schlossName === raum.ausgang) {
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
