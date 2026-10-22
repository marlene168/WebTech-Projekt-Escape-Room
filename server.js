// Kleiner Webserver für die lokale Entwicklung: liefert die Dateien aus public/ aus
// (darunter public/shared/ mit den öffentlichen Raumdaten und der Spiellogik).
// Spielregeln, Sitzungen und Geheimnisse liegen im Supabase-Backend (supabase/), nicht hier.
import express from "express";

const app = express();
// Hoster wie Render geben den Port über die Umgebungsvariable PORT vor, lokal nehmen wir 3000.
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

app.listen(PORT, () => {
  console.log(`Escape Room läuft auf http://localhost:${PORT}`);
});
