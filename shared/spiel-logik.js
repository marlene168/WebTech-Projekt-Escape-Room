// Spiellogik: die Regeln des Spiels als reine Funktionen.
// Sie bekommen den Raum, den bisherigen Spielstand und eine Aktion und geben den neuen Spielstand zurück.
// Kein Zugriff auf Browser oder Bildschirm – deshalb kann später auch der Server genau diese Datei nutzen.
//
// Der Spielstand wird nie verändert, sondern immer neu erzeugt. Ändert eine Aktion nichts,
// kommt derselbe Spielstand zurück – so lässt sich leicht prüfen, ob sich etwas getan hat.

export function erstelleSpielstand(raum) {
  return {
    raumId: raum.id,
    status: "laeuft", // "laeuft" oder "gewonnen"
    gefundeneSpuren: [], // Namen der Spuren in der Reihenfolge, in der sie gefunden wurden
    geoeffneteSchloesser: [],
    fehlversuche: 0, // falsch eingegebene Codes (die Anzeige lässt dann das Schloss wackeln)
  };
}

// Aktionen:
//   { typ: "untersuche", objekt: "<objekt-id>" }                   → ein Objekt wurde angeklickt
//   { typ: "probiereCode", schloss: "<schloss>", code: "<ziffern>" } → Code an einem Schloss eingeben
export function verarbeiteAktion(raum, spielstand, aktion) {
  // Nach dem Ende des Spiels ändert sich nichts mehr
  if (spielstand.status !== "laeuft") return spielstand;

  switch (aktion.typ) {
    case "untersuche":
      return untersuche(raum, spielstand, aktion.objekt);
    case "probiereCode":
      return probiereCode(raum, spielstand, aktion.schloss, aktion.code);
    default:
      return spielstand;
  }
}

function untersuche(raum, spielstand, objektId) {
  const objekt = findeObjekt(raum, objektId);
  if (objekt?.aktion?.typ !== "findeSpur") return spielstand;

  const spur = objekt.aktion.spur;
  if (!raum.spuren[spur] || spielstand.gefundeneSpuren.includes(spur)) return spielstand;

  return { ...spielstand, gefundeneSpuren: [...spielstand.gefundeneSpuren, spur] };
}

function probiereCode(raum, spielstand, schlossName, code) {
  const schloss = raum.schloesser?.[schlossName];
  if (!schloss || spielstand.geoeffneteSchloesser.includes(schlossName)) return spielstand;

  if (code !== schloss.code) {
    return { ...spielstand, fehlversuche: spielstand.fehlversuche + 1 };
  }

  return {
    ...spielstand,
    geoeffneteSchloesser: [...spielstand.geoeffneteSchloesser, schlossName],
    status: schlossName === raum.ausgang ? "gewonnen" : spielstand.status,
  };
}

// Sucht ein Objekt in allen Szenen des Raums.
export function findeObjekt(raum, objektId) {
  for (const szene of Object.values(raum.szenen)) {
    const objekt = szene.objekte.find((o) => o.id === objektId);
    if (objekt) return objekt;
  }
  return undefined;
}
