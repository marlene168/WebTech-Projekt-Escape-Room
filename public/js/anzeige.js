// Anzeige: zeichnet Szenen und Objekte auf die Bühne und zeigt Texte an.
// Enthält keine Spielregeln – nur Darstellung.

const buehne = document.querySelector(".buehne");
const hintergrund = document.querySelector(".szene-hintergrund");
const textfenster = document.querySelector(".textfenster");

// Zeichnet eine Szene neu. "beiKlick" wird mit dem angeklickten Objekt aufgerufen.
export function zeichneSzene(szene, beiKlick) {
  // Hintergrund: echtes Bild, falls vorhanden, sonst Platzhalter
  if (szene.hintergrund) {
    hintergrund.style.backgroundImage = `url("${szene.hintergrund}")`;
    hintergrund.classList.remove("platzhalter-hintergrund");
  } else {
    hintergrund.style.backgroundImage = "";
    hintergrund.classList.add("platzhalter-hintergrund");
  }

  // Alte Objekte entfernen, neue anlegen
  buehne.querySelectorAll(".objekt").forEach((element) => element.remove());
  for (const objekt of szene.objekte) {
    const element = erstelleObjekt(objekt);
    element.addEventListener("click", () => beiKlick(objekt));
    buehne.append(element);
  }
}

// Ein Objekt ist ein Knopf (dadurch auch per Tastatur bedienbar), positioniert in Prozent.
function erstelleObjekt(objekt) {
  const element = document.createElement("button");
  element.className = "objekt";
  element.title = objekt.name;
  element.style.left = `${objekt.x}%`;
  element.style.top = `${objekt.y}%`;
  element.style.width = `${objekt.breite}%`;
  element.style.height = `${objekt.hoehe}%`;

  if (objekt.bild) {
    const bild = document.createElement("img");
    bild.src = objekt.bild;
    bild.alt = objekt.name;
    // Datei fehlt oder ist kaputt → Platzhalter statt leerer Fläche
    bild.addEventListener("error", () => zeigePlatzhalter(element, objekt));
    element.append(bild);
  } else {
    zeigePlatzhalter(element, objekt);
  }
  return element;
}

function zeigePlatzhalter(element, objekt) {
  element.classList.add("platzhalter");
  element.innerHTML = `
    <span class="platzhalter-emoji">${objekt.emoji}</span>
    <span class="platzhalter-name">${objekt.name}</span>`;
}

export function zeigeText(titel, text) {
  textfenster.querySelector(".textfenster-titel").textContent = titel;
  textfenster.querySelector(".textfenster-text").textContent = text;
  textfenster.showModal();
}

// Klick neben das Textfenster schließt es ebenfalls
textfenster.addEventListener("click", (ereignis) => {
  if (ereignis.target === textfenster) textfenster.close();
});
