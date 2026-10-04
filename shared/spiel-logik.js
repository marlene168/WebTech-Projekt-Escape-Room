// Spiellogik: die Regeln des Spiels als reine Funktionen.
// Sie bekommen den Raum, den bisherigen Spielstand und eine Aktion und geben den neuen Spielstand zurück.
// Kein Zugriff auf Browser oder Bildschirm – deshalb kann später auch der Server genau diese Datei nutzen.
//
// Der Spielstand wird nie verändert, sondern immer neu erzeugt. Ändert eine Aktion nichts,
// kommt derselbe Spielstand zurück – so lässt sich leicht prüfen, ob sich etwas getan hat.

export function erstelleSpielstand(raum) {
  return {
    raumId: raum.id,
    gefundeneSpuren: [], // Namen der Spuren in der Reihenfolge, in der sie gefunden wurden
  };
}

// Aktionen:
//   { typ: "untersuche", objekt: "<objekt-id>" }  → ein Objekt wurde angeklickt
export function verarbeiteAktion(raum, spielstand, aktion) {
  switch (aktion.typ) {
    case "untersuche":
      return untersuche(raum, spielstand, aktion.objekt);
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

// Sucht ein Objekt in allen Szenen des Raums.
export function findeObjekt(raum, objektId) {
  for (const szene of Object.values(raum.szenen)) {
    const objekt = szene.objekte.find((o) => o.id === objektId);
    if (objekt) return objekt;
  }
  return undefined;
}
