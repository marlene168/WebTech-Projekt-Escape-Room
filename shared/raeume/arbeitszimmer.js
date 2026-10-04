// Raumdaten: Das Arbeitszimmer des Professors.
// Hier steht nur, WAS es im Raum gibt – wie es angezeigt wird, entscheidet public/js/anzeige.js.
//
// Positionen (x, y, breite, hoehe) sind Prozentwerte der Bühne:
// x/y = linke obere Ecke, 0/0 = oben links, 100/100 = unten rechts.
//
// Grafiken: "hintergrund" bzw. "bild" auf einen Pfad setzen, z. B. "bilder/arbeitszimmer/schreibtisch.png".
// Steht dort null (oder fehlt die Datei), wird ein Platzhalter angezeigt
// ("platzhalter" bestimmt, wie der Platzhalter-Hintergrund einer Szene aussieht).
//
// Objekte zeigen beim Klick ihren "text" – oder führen ihre "aktion" aus:
//   { typ: "oeffneSzene", ziel: "<szene>" }  → in eine Detailansicht hineinzoomen
//   { typ: "findeSpur", spur: "<spur>" }      → Text zeigen und die Spur ins Notizbuch eintragen
//   { typ: "schloss", schloss: "<schloss>" }  → Zahlenschloss öffnen und einen Code probieren

export default {
  id: "arbeitszimmer",
  titel: "Das Arbeitszimmer des Professors",
  schwierigkeit: 1, // 1 = leicht, 2 = mittel, 3 = schwer (siehe shared/raeume/index.js)
  kurzbeschreibung:
    "Professor Albers ist seit drei Tagen verschwunden. In seinem Arbeitszimmer fällt die Tür hinter dir ins Schloss – finde den Code, bevor der Hausmeister kommt.",
  vorschaubild: null, // Bild für die Raumkarte auf der Startseite, z. B. "bilder/arbeitszimmer/vorschau.jpg"
  dauerSekunden: 600, // 10 Minuten
  strafeProTippSekunden: 60, // so viel Zeit kostet jeder Tipp
  startSzene: "raum",

  szenen: {
    // ---------- Hauptraum ----------
    raum: {
      hintergrund: null,
      platzhalter: "zimmer",
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
          aktion: { typ: "oeffneSzene", ziel: "bild" },
        },
        {
          id: "pinnwand",
          name: "Pinnwand",
          emoji: "📌",
          bild: null,
          x: 52, y: 10, breite: 19, hoehe: 26,
          aktion: { typ: "oeffneSzene", ziel: "pinnwand" },
        },
        {
          id: "schreibtisch",
          name: "Schreibtisch",
          emoji: "🪑",
          bild: null,
          x: 28, y: 46, breite: 36, hoehe: 30,
          aktion: { typ: "oeffneSzene", ziel: "schreibtisch" },
        },
        {
          id: "tuer",
          name: "Tür",
          emoji: "🚪",
          bild: null,
          x: 79, y: 14, breite: 14, hoehe: 56,
          aktion: { typ: "schloss", schloss: "tuer" },
        },
      ],
    },

    // ---------- Detailansicht: Schreibtisch ----------
    schreibtisch: {
      hintergrund: null,
      platzhalter: "holz",
      objekte: [
        {
          id: "papiere",
          name: "Papierstapel",
          emoji: "📄",
          bild: null,
          x: 8, y: 18, breite: 32, hoehe: 46,
          aktion: { typ: "findeSpur", spur: "brief" },
          text: "Berechnungen, Skizzen von Sternbildern und ein halb geschriebener Brief: „… sollte mir etwas zustoßen, folgt den Farben.“",
        },
        {
          id: "kalender",
          name: "Kalender",
          emoji: "📅",
          bild: null,
          x: 56, y: 12, breite: 28, hoehe: 48,
          aktion: { typ: "findeSpur", spur: "gruen" },
          text: "Ein Tischkalender, aufgeschlagen beim Oktober. Der 1. ist mit grüner Tinte dick eingekreist.",
        },
        {
          id: "fueller",
          name: "Füllfederhalter",
          emoji: "🖋️",
          bild: null,
          x: 40, y: 68, breite: 18, hoehe: 20,
          text: "Ein Füllfederhalter mit grüner Tinte. Die Feder ist noch feucht.",
        },
      ],
    },

    // ---------- Detailansicht: Pinnwand ----------
    pinnwand: {
      hintergrund: null,
      platzhalter: "kork",
      objekte: [
        {
          id: "foto",
          name: "Foto",
          emoji: "📷",
          bild: null,
          x: 10, y: 14, breite: 24, hoehe: 40,
          text: "Ein Foto des Professors vor einem Hafen. Er lächelt. Auf der Rückseite steht nichts.",
        },
        {
          id: "notiz",
          name: "Notiz",
          emoji: "📝",
          bild: null,
          x: 40, y: 20, breite: 24, hoehe: 34,
          aktion: { typ: "findeSpur", spur: "reihenfolge" },
          text: "Eine Notiz in der Handschrift des Professors: „Rot – Grün – Blau“.",
        },
        {
          id: "blauer-zettel",
          name: "Blauer Zettel",
          emoji: "🟦",
          bild: null,
          x: 70, y: 48, breite: 18, hoehe: 30,
          aktion: { typ: "findeSpur", spur: "blau" },
          text: "Ein kleiner blauer Zettel. Darauf steht nur eine große 7.",
        },
      ],
    },

    // ---------- Detailansicht: Gemälde ----------
    bild: {
      hintergrund: null,
      platzhalter: "wand",
      objekte: [
        {
          id: "gemaelde",
          name: "Hafenstadt",
          emoji: "⛵",
          bild: null,
          x: 25, y: 8, breite: 50, hoehe: 72,
          text: "Die Hafenstadt aus der Nähe: Schiffe, Möwen, ein Leuchtturm. Der Maler hat sorgfältig gearbeitet.",
        },
        {
          id: "rahmenecke",
          name: "Rahmenecke",
          emoji: "🔍",
          bild: null,
          x: 68, y: 68, breite: 11, hoehe: 18,
          aktion: { typ: "findeSpur", spur: "rot" },
          text: "In die untere rechte Ecke des Rahmens ist eine kleine rote 4 eingeritzt.",
        },
      ],
    },
  },

  // Spuren, die im Notizbuch landen (Schlüssel = Name der Spur, siehe "findeSpur" oben)
  spuren: {
    brief: { titel: "„Folgt den Farben“", text: "Aus einem halb geschriebenen Brief auf dem Schreibtisch." },
    rot: { titel: "Rote 4", text: "In die Ecke des Bilderrahmens eingeritzt." },
    gruen: { titel: "Grüne 1", text: "Im Kalender mit grüner Tinte eingekreist." },
    blau: { titel: "Blaue 7", text: "Auf einem blauen Zettel an der Pinnwand." },
    reihenfolge: { titel: "Rot – Grün – Blau", text: "Notiz des Professors an der Pinnwand. Eine Reihenfolge?" },
  },

  // Zahlenschlösser (Schlüssel = Name des Schlosses, siehe "schloss" oben)
  schloesser: {
    tuer: {
      name: "Zahlenschloss an der Tür",
      text: "Ein schweres Schloss aus Messing mit drei Rädchen. Die Tür ist der einzige Weg hinaus.",
      code: "417",
    },
  },

  // Wird dieses Schloss geöffnet, ist der Raum geschafft.
  ausgang: "tuer",

  // Gestufte Tipps für den Hilfe-Knopf: vom vagen Hinweis bis zur Lösung
  tipps: [
    "Drei Dinge im Raum lassen sich aus der Nähe ansehen: der Schreibtisch, die Pinnwand und das Gemälde. Schau dort genau hin.",
    "Der Professor schreibt in seinem Brief: „Folgt den Farben.“ Achte auf eine rote, eine grüne und eine blaue Ziffer.",
    "Die Notiz an der Pinnwand nennt die Reihenfolge: Rot – Grün – Blau. Der Code lautet also 4 – 1 – 7.",
  ],
};
