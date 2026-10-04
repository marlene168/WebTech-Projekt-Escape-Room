// Raumdaten: Das Arbeitszimmer des Professors.
// Hier steht nur, WAS es im Raum gibt – wie es angezeigt wird, entscheidet public/js/anzeige.js.
//
// Positionen (x, y, breite, hoehe) sind Prozentwerte der Bühne:
// x/y = linke obere Ecke, 0/0 = oben links, 100/100 = unten rechts.
//
// Grafiken: "hintergrund" bzw. "bild" auf einen Pfad setzen, z. B. "bilder/arbeitszimmer/schreibtisch.png".
// Steht dort null (oder fehlt die Datei), wird ein Platzhalter angezeigt.

export default {
  id: "arbeitszimmer",
  titel: "Das Arbeitszimmer des Professors",
  startSzene: "raum",

  szenen: {
    raum: {
      hintergrund: null,
      objekte: [
        {
          id: "regal",
          name: "Bücherregal",
          emoji: "📚",
          bild: null,
          x: 4, y: 10, breite: 16, hoehe: 60,
          text: "Staubige Bücher über Physik, Astronomie und Geschichte. Nichts davon wirkt, als hätte es in letzter Zeit jemand angefasst.",
        },
        {
          id: "bild",
          name: "Gemälde",
          emoji: "🖼️",
          bild: null,
          x: 29, y: 12, breite: 14, hoehe: 22,
          text: "Ein altes Ölgemälde einer Hafenstadt. Der Rahmen sieht aus, als wäre er schon oft abgenommen worden.",
        },
        {
          id: "pinnwand",
          name: "Pinnwand",
          emoji: "📌",
          bild: null,
          x: 52, y: 10, breite: 19, hoehe: 26,
          text: "Zettel, Fotos und Notizen, mit bunten Nadeln festgesteckt. Aus der Nähe könnte man mehr erkennen.",
        },
        {
          id: "schreibtisch",
          name: "Schreibtisch",
          emoji: "🪑",
          bild: null,
          x: 28, y: 46, breite: 36, hoehe: 30,
          text: "Ein schwerer Eichenschreibtisch voller Papiere. Obenauf liegt ein Kalender.",
        },
        {
          id: "tuer",
          name: "Tür",
          emoji: "🚪",
          bild: null,
          x: 79, y: 14, breite: 14, hoehe: 56,
          text: "Die einzige Tür ist verschlossen. Ein Zahlenschloss mit drei Ziffern hält sie zu.",
        },
      ],
    },
  },
};
