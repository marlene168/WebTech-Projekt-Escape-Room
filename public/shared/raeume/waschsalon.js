// Raumdaten: Der Waschsalon „Sonnenschein“ (Raum 2, „Letzter Waschgang“).
// Aufbau wie beim Arbeitszimmer (siehe arbeitszimmer.js): Hier steht nur, WAS es im Raum gibt.
// Diese Datei ist öffentlich: Lösungen und Tipp-Texte stehen nur im Backend
// (supabase/functions/_shared/raeume/waschsalon.geheim.js).
//
// Medien liegen in public/bilder/waschsalon/, public/toene/waschsalon/ und public/videos/waschsalon/.

export default {
  id: "waschsalon",
  // Raumversion: erhöhen, sobald sich Rätsel oder Lösungen ändern (gespeicherte Sitzungen erkennen das)
  version: 1,
  titel: "Letzter Waschgang",
  schwierigkeit: 2, // 1 = leicht, 2 = mittel, 3 = schwer (siehe shared/raeume/index.js)
  kurzbeschreibung:
    "Ein verregneter Abend im Waschsalon der 80er. Bunte Lichter, Synth-Pop – und ein Telefon, das klingelt, obwohl niemand weiß, dass du hier bist.",
  vorschaubild: null, // Bild für die Raumkarte auf der Startseite, z. B. "bilder/waschsalon/vorschau.jpg"
  dauerSekunden: 900, // 15 Minuten

  geschichte: {
    intro: {
      titel: "Nur noch eine Ladung",
      text: [
        "Freitag, 13. November 1987, kurz vor elf. Es regnet seit Stunden, und deine Waschmaschine zu Hause hat aufgegeben.",
        "Der Waschsalon „Sonnenschein“ an der Ecke hat noch Licht. Das Türglöckchen bimmelt, aus dem Radio läuft Synth-Pop, bunte Glühbirnen hängen über den Maschinen. Niemand sonst ist hier.",
        "Du stellst deinen vollen Wäschekorb ab und siehst dich nach einer freien Maschine um. Da klingelt das beige Telefon auf dem türkisfarbenen Wandbord.",
      ],
      video: null, // später z. B. "videos/waschsalon/intro.mp4"
    },
    gewonnen: {
      text: [
        "Maschine 7 springt an. Im selben Moment ruckt Maschine 8, bleibt stehen und dreht sich langsam rückwärts. Ihre Tür springt auf: deine Wäsche, warm und trocken. Vorn an der Eingangstür klackt das Magnetschloss.",
        "Du trittst hinaus in den Regen. Hinter dir klingelt das Telefon. Du drehst dich nicht um.",
      ],
      video: null,
    },
    verloren: {
      spannung: "Das Brummen wird lauter. Maschine 8 schleudert, schneller, immer schneller. Die Lichter gehen aus …",
      text: [
        "Am nächsten Morgen findet die erste Kundin auf dem Tresen einen Korb frisch gefalteter Wäsche. Sie ist noch warm.",
        "Auf dem Kassenbon daneben steht: Maschine 8 · Letzter Waschgang.",
      ],
      // Schreckmoment mit eingebautem Ersatzton; später { sound: "toene/waschsalon/schreck.mp3" }
      schreck: { sound: null },
      video: null,
    },
  },
  strafeProTippSekunden: 60,
  startSzene: "raum",

  szenen: {
    // ---------- Hauptraum ----------
    raum: {
      hintergrund: null,
      platzhalter: "waschsalon",
      objekte: [],
    },
  },

  spuren: {},

  // Die Lösung (Reihenfolge der Tasten-IDs) steht im Backend (waschsalon.geheim.js).
  raetsel: {
    programm: {
      typ: "tastenfolge",
      name: "Bedienfeld von Maschine 7",
      text: "Maschine 7 ist frei. Vier Programmtasten mit Symbol und Namen, ein Startknopf.",
      tasten: [
        { id: "vor", name: "Vorwäsche", symbol: "◔" },
        { id: "haupt", name: "Hauptwäsche", symbol: "◑" },
        { id: "spuelen", name: "Spülen", symbol: "≋" },
        { id: "schleudern", name: "Schleudern", symbol: "↻" },
      ],
      laenge: 5, // so viele Programmschritte hat die Eingabe
    },
  },

  // Wird dieses Rätsel gelöst, ist der Raum geschafft.
  ausgang: "programm",

  anzahlTipps: 4,
};
