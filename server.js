// Kleiner Webserver: liefert die Dateien aus public/ (Anzeige) und shared/ (Raumdaten und Spiellogik) aus.
// Später kommt hier der Mehrspieler-Teil (Socket.IO) dazu.
import express from "express";

const app = express();
// Hoster wie Render geben den Port über die Umgebungsvariable PORT vor, lokal nehmen wir 3000.
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use("/shared", express.static("shared"));

app.listen(PORT, () => {
  console.log(`Escape Room läuft auf http://localhost:${PORT}`);
});
