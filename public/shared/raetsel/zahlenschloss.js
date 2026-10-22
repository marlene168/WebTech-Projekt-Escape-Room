// Rätseltyp "zahlenschloss": An Rädchen wird eine Ziffernfolge eingestellt.
// Raumdaten (öffentlich): { typ: "zahlenschloss", name, text, stellen } – "stellen" = Anzahl der Rädchen
// Lösung (geheim):        z. B. "123" – die Ziffern als Text

// Stimmt die Eingabe? Nur ein Text mit genau den richtigen Ziffern zählt.
export function pruefe(eingabe, loesung) {
  return typeof eingabe === "string" && eingabe === loesung;
}
