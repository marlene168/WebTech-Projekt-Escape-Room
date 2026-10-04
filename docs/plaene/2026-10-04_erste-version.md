# Plan: Erste Version der Escape-Room-WebApp

## Kontext
Das Repository enthält bisher nur Regeln und Dokumentation. Das langfristige Ziel ist eine online gehostete App, in der mehrere Personen von verschiedenen Geräten aus gemeinsam einen Raum spielen.
Version 1 ist bewusst klein: ein Raum (Arbeitszimmer), ein Spieler, wenige klickbare Objekte mit Detailansichten, Spuren, ein Zahlenschloss als Rätsel, ein Hilfe-Knopf und ein Timer.
Der Aufbau soll so sein, dass Hosting, Mehrspieler-Modus und weitere Räume später **ergänzt** werden können, ohne alles umzubauen.

## Getroffene Entscheidungen (aus den Rückfragen)
| Thema | Entscheidung |
|---|---|
| Frontend | HTML, CSS und JavaScript ohne Framework (ES-Module, kein Build-Werkzeug) |
| Server | Kleiner Node.js-Server mit Express ab Schritt 1 |
| Mehrspieler (später) | Gemeinsamer Raum, live synchron, Beitritt per Raum-Code |
| Seminar-Vorgaben | keine |
| Thema Raum 1 | Arbeitszimmer eines verschwundenen Professors |
| Darstellung | Ein Hintergrundbild (Wände und Boden, nicht klickbar), darüber jeder Gegenstand als eigenes klickbares Element. Später kommen KI-generierte PNGs mit transparentem Hintergrund, jeweils einzeln austauschbar. Klickt man auf einen Gegenstand, zoomt das Spiel in eine Detailansicht. |
| Hinweise | Spuren in Objekten, gesammelt im Notizbuch, plus Hilfe-Knopf mit gestuften Tipps gegen Zeitstrafe |
| Timer-Ende | Spiel vorbei, Bildschirm mit Neustart-Knopf |

## Architektur (die drei Ideen, die spätere Erweiterungen möglich machen)

1. **Räume sind Daten, kein Code.** Jeder Raum ist eine eigene Datei, die beschreibt, welche Szenen, Objekte, Spuren, Schlösser und Tipps es gibt. Ein neuer Raum ist dann einfach eine neue Datei plus ein Bilderordner. Der Programmcode bleibt gleich.
2. **Die Spiellogik ist von der Anzeige getrennt.** `shared/spiel-logik.js` besteht aus reinen Funktionen: Sie bekommen den Spielstand und eine Aktion und liefern den neuen Spielstand zurück. Sie greifen nicht auf den Browser zu. Deshalb kann später der Server genau dieselbe Datei ausführen.
3. **Eine „Verbindung“ als Zwischenschicht.** Die Anzeige schickt Aktionen wie `{ typ: "untersuche", objekt: "bild" }` an die Verbindung und wird benachrichtigt, wenn sich der Spielstand ändert.
   - In Version 1 rechnet `verbindung-lokal.js` direkt im Browser.
   - Später übernimmt `verbindung-online.js` (Socket.IO) diese Aufgabe und schickt die Aktionen an den Server. Die Anzeige merkt davon nichts.

Weitere Festlegungen mit Blick auf den Mehrspieler-Modus:
- **Gemeinsamer Spielstand:** gefundene Spuren, verbrauchte Tipps, Schloss geöffnet, Startzeit, Strafzeit.
- **Lokaler Zustand pro Gerät:** welche Szene man gerade ansieht. So kann sich später jede Person unabhängig umsehen.
- **Timer:** Gespeichert werden `startzeit` und `dauer`, keine Variable, die herunterzählt. Die Restzeit wird jedes Mal neu berechnet. So zeigen später alle Geräte dieselbe Zeit an.
- **Port:** Der Server liest den Port aus `process.env.PORT` (Standard 3000). Damit läuft er später ohne Änderung bei einem Hoster wie Render.

### Ordnerstruktur
```
server.js                      Express: liefert public/ und shared/ aus
package.json                   "type": "module", Skripte start/test
public/
  index.html
  css/style.css
  js/main.js                   Start, verbindet Anzeige und Verbindung
  js/anzeige.js                zeichnet Szene, Objekte, Dialoge, Timer
  js/verbindung-lokal.js       führt Aktionen lokal mit spiel-logik.js aus
  bilder/arbeitszimmer/        später: hintergrund-raum.png, schreibtisch.png …
shared/
  spiel-logik.js               erstelleSpielstand(), verarbeiteAktion(), restzeit()
  raeume/index.js              Liste aller Räume
  raeume/arbeitszimmer.js      Raumdaten
test/spiel-logik.test.js       Tests mit dem eingebauten node:test (keine Zusatzpakete)
```

### Darstellung und Grafiken
- **Spielbühne:** feste Fläche im Seitenverhältnis 16:9, die sich an jeden Bildschirm anpasst. Alle Objekte werden in **Prozent** positioniert (`x`, `y`, `breite`, `hoehe`). Dadurch liegen Grafiken auf Handy und PC an derselben Stelle.
- **Jede Szene** hat ein `hintergrund`-Bild. Fehlt es, wird ein CSS-Farbverlauf als Platzhalter angezeigt.
- **Jedes Objekt** hat ein Feld `bild`. Fehlt es oder lässt sich die Datei nicht laden, erscheint ein Platzhalter: ein umrandetes Feld mit Emoji und Namen.
- **Grafik austauschen:** PNG in `public/bilder/<raum>/` legen und den Pfad beim Objekt eintragen. Sonst muss nichts geändert werden.
- **Zoom:** Beim Klick auf ein Objekt mit Detailansicht vergrößert sich die Bühne in Richtung dieses Objekts (CSS-Transform, Ursprung in der Objektmitte) und blendet dann zur Detailszene über. Ein „Zurück“-Knopf zoomt wieder heraus.

### Raumdaten (Beispiel für das Format)
```js
export default {
  id: "arbeitszimmer", titel: "Das Arbeitszimmer des Professors",
  dauerSekunden: 600, strafeProTippSekunden: 60,
  startSzene: "raum",
  szenen: {
    raum: { hintergrund: null, objekte: [
      { id: "schreibtisch", name: "Schreibtisch", emoji: "🪑", bild: null,
        x: 30, y: 55, breite: 35, hoehe: 30,
        aktion: { typ: "oeffneSzene", ziel: "schreibtisch" } },
      { id: "tuer", name: "Tür", emoji: "🚪", aktion: { typ: "schloss", schloss: "tuer" } },
      // …
    ]},
    schreibtisch: { hintergrund: null, objekte: [ /* Gegenstände in der Detailansicht */ ] },
  },
  spuren: { gruen: { text: "Eine grüne 1 …" } },
  schloesser: { tuer: { stellen: 3, code: "417" } },
  tipps: ["…", "…", "…"],
};
```
Objekt-Aktionen: `oeffneSzene`, `zeigeText`, `findeSpur`, `schloss`.

### Rätsel-Entwurf (Details können wir beim Umsetzen noch anpassen)
- **Hauptraum:** Schreibtisch, Pinnwand und Bild öffnen je eine Detailansicht. Das Bücherregal liefert nur einen Text (falsche Fährte). Die Tür hat ein 3-stelliges Zahlenschloss.
- **Bild (Detail):** In der Rahmenecke ist eine rote **4** eingeritzt.
- **Schreibtisch (Detail):** Auf dem Kalender ist eine grüne **1** eingekreist.
- **Pinnwand (Detail):** Ein blauer Zettel mit einer **7** und eine Notiz: „Rot – Grün – Blau“.
- **Code:** 417. Drei gestufte Tipps, jeder kostet 60 Sekunden. Spielzeit: 10 Minuten.

## Umsetzung in kleinen Schritten
Nach jedem Schritt öffnest du `http://localhost:3000` und siehst die Änderung. Jeder Schritt bekommt nach den Projektregeln einen eigenen Commit, einen Doku-Eintrag und einen Push.

1. **Projektgerüst und Server**: `package.json`, Express installieren, `server.js`, eine einfache `index.html`.
   *Im Browser:* Mit `npm start` erscheint die Seite „Escape Room“.
2. **Spielbühne**: Die 16:9-Bühne passt sich an das Fenster an und zeigt einen Platzhalter-Hintergrund für den Raum. Darüber steht eine Kopfleiste mit dem Raumtitel.
   *Im Browser:* Ein dunkler „Raum“ füllt das Fenster und behält beim Verkleinern seine Form.
3. **Raumdaten und Objekte**: `shared/raeume/arbeitszimmer.js` wird angelegt und die Objekte als Platzhalter gezeichnet (Hover-Effekt). Ein Klick auf ein Objekt zeigt dessen Text in einem Textfenster.
   *Im Browser:* Die Gegenstände stehen im Raum und reagieren auf Klicks.
4. **Detailansichten mit Zoom**: Schreibtisch, Pinnwand und Bild öffnen ihre Detailszene mit Zoom-Animation, „Zurück“ führt wieder heraus.
   *Im Browser:* Man kann in die Gegenstände hineinzoomen.
5. **Spiellogik, Spuren und Notizbuch**: `spiel-logik.js` und `verbindung-lokal.js` werden angelegt. Gefundene Spuren landen im Notizbuch. Dazu kommen erste Tests (`npm test`).
   *Im Browser:* Das Notizbuch füllt sich, bereits gefundene Spuren sind markiert.
6. **Zahlenschloss**: Ein Klick auf die Tür öffnet einen Dialog mit Ziffernrädern. Ein falscher Code löst Wackeln aus, der richtige Code zeigt den Gewinn-Bildschirm.
   *Im Browser:* Das Spiel ist von Anfang bis Ende lösbar.
7. **Timer und Spielende**: Ein Countdown erscheint in der Kopfleiste. Läuft er ab, erscheint „Zeit abgelaufen“, und alle Spielende-Bildschirme haben einen Neustart-Knopf.
   *Im Browser:* Die Zeit läuft und das Spiel kann verloren gehen.
8. **Hilfe-Knopf**: Gestufte Tipps werden angezeigt und jeder Tipp zieht Zeit ab. Der Gewinn-Bildschirm zeigt Restzeit und Anzahl der genutzten Tipps.
   *Im Browser:* Der Hilfe-Knopf funktioniert.
9. **Startseite und Raumauswahl**: Eine Startseite listet die Räume aus `shared/raeume/index.js` als Karten, ein Klick startet das Spiel. Dazu kommt eine kurze Anleitung „Grafik austauschen / neuen Raum anlegen“ in `docs/`.
   *Im Browser:* Die Startseite mit der Raumauswahl ist da.

## Spätere Erweiterungen (nicht Teil dieser Version)
- **Mehrspieler-Modus:** Socket.IO kommt in `server.js` dazu. Der Server verwaltet je Raum-Code einen Spielstand mit derselben `spiel-logik.js`. Im Client ersetzt `verbindung-online.js` die lokale Verbindung.
- **Hosting:** Ein Node-fähiger Hoster (z. B. Render) startet die App mit `npm start` und dem Port aus `PORT`.
- **Weitere Räume:** neue Datei in `shared/raeume/`, ein Bilderordner und ein Eintrag in `index.js`.

## Ablauf nach Freigabe (laut CLAUDE.md)
1. Diesen Plan als `docs/plaene/<Datum>_erste-version.md` speichern (Datum per `date`).
2. Einen Planungseintrag in DOKUMENTATION.md anlegen, die Entscheidungen in Abschnitt 3 eintragen und Tech-Stack und Werkzeuge in Abschnitt 1 ergänzen.
3. Commit „Doku: Planung zu erste Version“ erstellen und pushen. Danach beginnt Schritt 1.

## Überprüfung
- Nach jedem Schritt: `npm start` ausführen und `http://localhost:3000` im Browser öffnen. Ich prüfe selbst, dass der Server ohne Fehler startet und die Seite sowie die Dateien ausgeliefert werden (Abruf mit `curl`). Du schaust dir das Ergebnis im Browser an.
- Ab Schritt 5: `npm test` prüft die Spiellogik (Spur finden, falscher und richtiger Code, Zeitstrafe, Zeit abgelaufen).
- Am Ende: Einmal komplett durchspielen, dabei einmal verlieren und einmal gewinnen, und dazwischen die Fenstergröße ändern bzw. die Handy-Ansicht der Entwicklertools nutzen.
