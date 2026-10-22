// Register aller Rätseltypen. Jeder Typ ist ein eigenes Modul mit pruefe(eingabe, loesung).
//
// Neuer Rätseltyp: Modul in diesem Ordner anlegen, hier eintragen und in public/js/main.js
// eine passende Anzeige zuordnen. Die Spiellogik (und später das Backend) bleibt unverändert.
import * as zahlenschloss from "./zahlenschloss.js";

export const RAETSELTYPEN = { zahlenschloss };
