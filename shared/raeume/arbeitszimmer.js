// Raumdaten: Das Arbeitszimmer des Professors.
// Hier steht nur, WAS es im Raum gibt – wie es angezeigt wird, entscheidet public/js/anzeige.js.
// Diese Datei ist öffentlich: Lösungen und Tipp-Texte stehen in arbeitszimmer.geheim.js.
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
//   { typ: "raetsel", raetsel: "<rätsel>" }   → Rätsel öffnen (z. B. Zahlenschloss) und eine Lösung probieren

export default {
  id: "arbeitszimmer",
  // Raumversion: erhöhen, sobald sich Rätsel oder Lösungen ändern (gespeicherte Sitzungen erkennen das später)
  version: 1,
  titel: "Das Arbeitszimmer des Professors",
  schwierigkeit: 1, // 1 = leicht, 2 = mittel, 3 = schwer (siehe shared/raeume/index.js)
  kurzbeschreibung:
    "Professor Albers ist seit drei Tagen verschwunden. In seinem Arbeitszimmer fällt die Tür hinter dir ins Schloss – finde den Code, bevor der Hausmeister kommt.",
  vorschaubild: null, // Bild für die Raumkarte auf der Startseite, z. B. "bilder/arbeitszimmer/vorschau.jpg"
  dauerSekunden: 600, // 10 Minuten

  // Die Geschichte dieses Raums. Jeder Raum braucht Intro, Outro ("gewonnen") und "verloren".
  // Texte sind Listen von Absätzen.
  // "video": optional, z. B. "videos/arbeitszimmer/intro.mp4" – der Text bleibt als Untertitel bzw. Ersatz.
  geschichte: {
    intro: {
      titel: "Ein offenes Arbeitszimmer",
      text: [
        "Seit drei Tagen hat niemand Professor Konrad Albers gesehen. Deine Abschlussarbeit liegt seit Wochen auf seinem Schreibtisch, deine Mails bleiben unbeantwortet, und im Sekretariat zuckt man nur mit den Schultern.",
        "Heute Abend steht die Tür zu seinem Arbeitszimmer einen Spalt offen. Drinnen brennt noch die Schreibtischlampe. Kaum bist du eingetreten, fällt die Tür hinter dir ins Schloss, und mit einem metallischen Klicken rastet das Zahlenschloss ein.",
        "Auf dem Schreibtisch glänzt frische Tinte. Wer war gerade noch hier? In zehn Minuten schließt der Hausmeister das Gebäude ab, und bis dahin musst du hier raus.",
      ],
      video: null,
    },
    gewonnen: {
      text: [
        "Das Schloss springt auf. Aus dem Türspalt fällt ein Umschlag, beschrieben in grüner Tinte: „Wer meine Farben lesen kann, dem kann ich vertrauen. Mir geht es gut, aber ich musste verschwinden. Suche mich nicht. Noch nicht.“",
        "Der Professor lebt, und er hat dir eine Nachricht hinterlassen.",
      ],
      video: null,
    },
    verloren: {
      // Optional: baut vor dem Ende Spannung auf (erscheint Satz für Satz)
      spannung: "Schritte auf dem Flur. Sie werden langsamer und bleiben direkt vor der Tür stehen. Stille. Ein Schlüssel dreht sich im Schloss …",
      text: [
        "… die Tür fliegt auf, und grelles Taschenlampenlicht trifft dich mitten ins Gesicht. „Was machen Sie hier drin?!“ Der Hausmeister.",
        "Das Rätsel um Professor Albers bleibt ungelöst.",
      ],
      // Pflichtfeld, bewusst zu entscheiden:
      //   null                → kein Schreckmoment (kein Licht, kein Ton, kein Hinweis auf der Raumkarte)
      //   { sound: null }     → Schreckmoment mit eingebautem Ersatzton
      //   { sound: "toene/arbeitszimmer/schreck.mp3" } → Schreckmoment mit eigener Sounddatei
      schreck: { sound: null },
      video: null, // ein Video ersetzt Spannungsaufbau und Schreckmoment
    },
  },
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
          aktion: { typ: "raetsel", raetsel: "tuer" },
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

  // Rätsel (Schlüssel = Name des Rätsels, siehe "raetsel" oben). "typ" verweist auf shared/raetsel/.
  // Die Lösungen stehen in arbeitszimmer.geheim.js.
  raetsel: {
    tuer: {
      typ: "zahlenschloss",
      name: "Zahlenschloss an der Tür",
      text: "Ein schweres Schloss aus Messing mit drei Rädchen. Die Tür ist der einzige Weg hinaus.",
      stellen: 3,
    },
  },

  // Wird dieses Rätsel gelöst, ist der Raum geschafft.
  ausgang: "tuer",

  // So viele Tipps gibt es für den Hilfe-Knopf (die Texte stehen in arbeitszimmer.geheim.js)
  anzahlTipps: 3,
};
