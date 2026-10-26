// Rätseltyp "tastenfolge": Tasten werden in einer bestimmten Reihenfolge gedrückt, danach "Start".
// Raumdaten (öffentlich): { typ: "tastenfolge", name, text, tasten: [{ id, name, symbol }], laenge }
// Lösung (geheim):        die Tasten-IDs in der richtigen Reihenfolge, mit Bindestrichen verbunden, z. B. "a-b-a"

// Stimmt die Eingabe? Nur genau dieselbe Folge als Text zählt.
export function pruefe(eingabe, loesung) {
  return typeof eingabe === "string" && eingabe === loesung;
}
