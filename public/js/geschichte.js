// Geschichte: zeigt Teile der Vorgeschichte eines Raums an (Intro, Outro, Ende bei Zeitablauf).
// Vorerst nur als Text – die optionalen Videos kommen in Schritt 9c dazu.

// Schreibt eine Liste von Absätzen als <p>-Elemente in das Element.
export function schreibeAbsaetze(element, absaetze) {
  element.replaceChildren(
    ...absaetze.map((text) => {
      const absatz = document.createElement("p");
      absatz.textContent = text;
      return absatz;
    }),
  );
}
