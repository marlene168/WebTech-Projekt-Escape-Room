// Geheime Daten des Waschsalons: Lösungen und Tipp-Texte.
// Liegt nur im Backend und geht nie an den Browser (öffentlicher Teil: public/shared/raeume/waschsalon.js).
// Ändert sich hier etwas an den Lösungen, muss "version" in waschsalon.js erhöht werden.

export default {
  // Lösung je Rätsel: die Tasten-IDs in der richtigen Reihenfolge, mit Bindestrichen verbunden.
  // Lichter Blau – Gelb – Rot – Grün – Rot = Spülen, Vorwäsche, Hauptwäsche, Schleudern, Hauptwäsche – rückwärts:
  loesungen: {
    programm: "haupt-schleudern-haupt-vor-spuelen",
  },

  // Gestufte Tipps für den Hilfe-Knopf: vom vagen Hinweis bis zur Lösung
  tipps: [
    "Die Lampe auf dem Tisch ist eine UV-Lampe. Leuchte damit die Programmtafel am Automaten an.",
    "Die Farben der Lichterkette stehen für Programmschritte. Den Schlüssel findest du unter UV-Licht auf der Programmtafel.",
    "Die Lichter zeigen Spülen, Vorwäsche, Hauptwäsche, Schleudern, Hauptwäsche. Gib das von hinten nach vorn an Maschine 7 ein.",
    "Lösung: Hauptwäsche, Schleudern, Hauptwäsche, Vorwäsche, Spülen, dann Start.",
  ],
};
