# Plan: Schritt 9 – Startseite, Schwierigkeitsgrade und Vorgeschichte

## Kontext
Die Schritte 1–8 der ersten Version sind fertig: Das Arbeitszimmer ist spielbar mit Spuren, Schloss, Timer und Hilfe. Laut ursprünglichem Plan fehlt noch Schritt 9: eine Startseite mit Raumauswahl und eine Anleitung zum Austauschen der Grafiken und Anlegen neuer Räume.

Die Nutzerin hat dazu drei Wünsche ergänzt:
- **Schwierigkeitsgrade:** Jeder Raum hat einen festen Schwierigkeitsgrad, spätere Räume sind schwerer. Das soll im Aufbau berücksichtigt sein, auch wenn es vorerst nur einen Raum gibt.
- **Vorgeschichte:** Nur für das Arbeitszimmer soll es eine spannende Vorgeschichte geben.
- **Grafiken:** Claude soll Bescheid geben, welche Grafiken gebraucht werden.
- **Videos und Schreckmoment** (nachgereicht vor der Freigabe):
  - Später sollen kurze KI-generierte Videos aus Sicht der Studierenden die Geschichte erzählen. Das soll jetzt vorbereitet werden; der Text bleibt als Untertitel bzw. Ersatz.
  - Bei Zeitablauf findet einen der Hausmeister, mit einem Schreckmoment (Einblendung und Ton), der auch ohne Video funktioniert.
- **Jeder Raum mit eigener Geschichte** (nachgereicht): Jeder spätere Raum bekommt eine eigene Vorgeschichte mit Intro und Outro, jeweils als Text und optional als Video. Der Schreckmoment ist pro Raum optional und muss bewusst an- oder abgeschaltet werden.

Verworfen wurde eine raumübergreifende Geschichte mit Gesamträtsel. Jeder Raum ist inhaltlich eigenständig.

## Entscheidungen (aus den Rückfragen)
| Thema | Entscheidung |
|---|---|
| Räume | inhaltlich eigenständig, jeder mit festem Schwierigkeitsgrad (1 = leicht, 2 = mittel, 3 = schwer) |
| Reihenfolge | **frei wählbar**, auf der Startseite nach Schwierigkeit sortiert (abgeleitet aus der Begründung „in beliebiger Reihenfolge spielen“). Ein Freischalten nacheinander ist vorerst nicht vorgesehen, das klären wir bei Bedarf. |
| Spielfigur | Studierende/r, die ihre Abschlussarbeit beim Professor schreibt |
| Auslöser | Die Tür fällt hinter einem ins Schloss, das Zahlenschloss rastet ein |
| Darstellung | Intro-Bildschirm vor dem Raum (der Timer startet erst mit „Raum betreten“) und ein Abschlusstext nach dem Sieg, der die Geschichte des Raums rund macht |

## Vorgeschichte (Entwurf, Wortlaut kann noch angepasst werden)
Die Geschichte nutzt Anknüpfungspunkte, die es im Raum schon gibt: feuchte grüne Tinte, „Folgt den Farben“, Hafenstadt mit Leuchtturm, das Foto am Hafen. Der Name des Professors ist ein Vorschlag.

**Intro: „Ein offenes Arbeitszimmer“**
> Seit drei Tagen hat niemand Professor Konrad Albers gesehen. Deine Abschlussarbeit liegt seit Wochen auf seinem Schreibtisch, deine Mails bleiben unbeantwortet, und im Sekretariat zuckt man nur mit den Schultern.
> Heute Abend steht die Tür zu seinem Arbeitszimmer einen Spalt offen. Drinnen brennt noch die Schreibtischlampe. Kaum bist du eingetreten, fällt die Tür hinter dir ins Schloss, und mit einem metallischen Klicken rastet das Zahlenschloss ein.
> Auf dem Schreibtisch glänzt frische Tinte. Wer war gerade noch hier? In zehn Minuten schließt der Hausmeister das Gebäude ab, und bis dahin musst du hier raus.

**Abschluss bei einem Sieg**
> Das Schloss springt auf. Aus dem Türspalt fällt ein Umschlag, beschrieben in grüner Tinte: „Wer meine Farben lesen kann, dem kann ich vertrauen. Mir geht es gut, aber ich musste verschwinden. Suche mich nicht. Noch nicht.“
> Der Professor lebt, und er hat dir eine Nachricht hinterlassen.

**Ende bei Zeitablauf (Wortlaut der Nutzerin, in zwei Teile geteilt)**
> *Spannungsaufbau:* Schritte auf dem Flur. Sie werden langsamer und bleiben direkt vor der Tür stehen. Stille. Ein Schlüssel dreht sich im Schloss …
> *Schreckmoment:* plötzliche Einblendung mit Soundeffekt
> *Danach:* … die Tür fliegt auf, und grelles Taschenlampenlicht trifft dich mitten ins Gesicht. „Was machen Sie hier drin?!“ Der Hausmeister. Das Rätsel um Professor Albers bleibt ungelöst.

## Umsetzung

### Aufbau
- **Zwei Seiten statt einer:**
  - `public/index.html` wird die **Startseite** mit der Raumauswahl.
  - Das bisherige Spiel zieht nach `public/spiel.html?raum=<id>` um.
  - Diese Lösung ist einfacher als ein Seitenwechsel per JavaScript und für Einsteiger gut nachvollziehbar.
- **Raumliste `shared/raeume/index.js`:** Sie exportiert alle Räume. Für die Startseite werden sie nach `schwierigkeit` sortiert.
- **Neue Felder in den Raumdaten** (`shared/raeume/arbeitszimmer.js`):
  - `schwierigkeit: 1`
  - `kurzbeschreibung` für die Raumkarte
  - `vorschaubild: null` (Platzhalter)
  - `geschichte` mit drei Teilen. **Jeder Raum muss alle drei Texte haben**: Intro, Outro (`gewonnen`) und `verloren`. Das `video` ist jeweils optional (vorerst `null`).
    ```js
    geschichte: {
      intro:    { titel: "Ein offenes Arbeitszimmer", text: ["…", "…"], video: null },
      gewonnen: { text: ["…"], video: null },   // Outro
      verloren: {
        spannung: "Schritte auf dem Flur. … Ein Schlüssel dreht sich im Schloss …", // optional
        text: ["… die Tür fliegt auf …", "Das Rätsel um Professor Albers bleibt ungelöst."],
        // Pflichtfeld, bewusst zu entscheiden:
        //   null                     → kein Schreckmoment (kein Licht, kein Ton, kein Hinweis auf der Karte)
        //   { sound: null|"…mp3" }   → Schreckmoment an; sound: null = eingebauter Ersatzton
        schreck: { sound: null },
        video: null, // ein Video ersetzt Spannungsaufbau und (falls an) den Schreck
      },
    }
    ```
  - Die Ende-Texte ziehen dadurch aus `anzeige.js` in die Raumdaten. So hat jeder Raum seine eigene Geschichte.
  - Der **Hinweis auf der Raumkarte** („⚠ Enthält einen Schreckmoment mit Ton“) wird **automatisch** aus `schreck` abgeleitet und erscheint nur bei Räumen mit Schreckmoment.
  - **Tests sichern die Vorgaben ab:** Jeder Raum hat Intro-, Outro- und Verloren-Text, und das Feld `schreck` ist ausdrücklich gesetzt (`null` oder Objekt). Fehlt es, schlägt `npm test` fehl. So bekommt kein Raum versehentlich einen Schreck oder vergisst seine Geschichte.
- **Spiellogik** (`shared/spiel-logik.js`): Ein neuer Status `"bereit"` steht vor `"laeuft"`.
  - `erstelleSpielstand` beginnt jetzt mit `bereit`, `startzeit: null`.
  - Eine neue Aktion `start` setzt die Startzeit und den Status `laeuft`.
  - Im Status `bereit` zeigt die Restzeit die volle Dauer, und andere Aktionen wirken nicht.
  - `neustart` beginnt direkt wieder mit `laeuft`; das Intro erscheint also nicht erneut.
  - Vorteil für später: Im Mehrspieler-Modus kann die Gruppe gemeinsam auf „Raum betreten“ warten (Lobby).
- **Spielseite** (`public/js/main.js`, `public/js/anzeige.js`):
  - Der Raum wird anhand des URL-Parameters geladen. Bei einem unbekannten Raum geht es zurück zur Startseite.
  - Das Intro-Fenster lässt sich nicht mit Esc schließen. Es zeigt die Geschichte mit dem Knopf „Raum betreten“, der die Aktion `start` auslöst.
  - Die Ende-Fenster zeigen die Texte aus `geschichte` und zusätzlich den Knopf „Zur Raumauswahl“.
  - In der Kopfleiste gibt es einen Link „← Räume“.
- **Startseite** (`public/js/start.js`): Für jeden Raum gibt es eine Karte mit Vorschaubild (Platzhalter), Titel, Schwierigkeit (★☆☆ Leicht / ★★☆ Mittel / ★★★ Schwer), Spieldauer, Kurzbeschreibung, dem Schreck-Hinweis (nur wenn `schreck` gesetzt ist) und dem Knopf „Spielen“. Der Stil passt zum Spiel (dunkel, Gold, Georgia).

### Geschichts-Videos (vorbereitet, vorerst ohne Videos)
- **Neues Modul `public/js/geschichte.js`:** Es zeigt einen Geschichtsteil an, also Intro, Sieg oder Zeitablauf.
  - **Ist ein `video` eingetragen:** Das Video läuft (`<video playsinline>`), der Text steht darunter als Untertitel, und ein Knopf „Überspringen ⏭“ beendet das Video.
  - **Ohne Video oder wenn es nicht lädt** (`error`-Ereignis): Es erscheint nur der Text. Das Spiel funktioniert also immer.
- **Autoplay-Regeln:** Browser blockieren Ton ohne vorherigen Klick.
  - **Intro:** Das Video startet erst nach einem Klick (Knopf „▶ Geschichte ansehen“, daneben „Raum betreten“ zum direkten Start).
  - **Sieg und Zeitablauf:** Bis dahin hat man bereits geklickt. Wirft `video.play()` trotzdem einen Fehler, erscheint ein Knopf „▶ Abspielen“ und der Text bleibt sichtbar.

### Schreckmoment bei Zeitablauf (ohne Video, nur wenn `schreck` gesetzt ist)
Bei `schreck: null` erscheint nach dem optionalen Spannungstext direkt der Ende-Bildschirm, ohne Licht und Ton.
1. Der Bildschirm dunkelt ab. Der Spannungstext erscheint ruhig, Satz für Satz, insgesamt etwa 5 Sekunden.
2. **Schreck:** Ein einziges grelles „Taschenlampenlicht“ (heller Lichtkegel) erscheint schlagartig und blendet über etwa 1 Sekunde aus, dazu der Soundeffekt. **Kein Blinken**, nur eine Einblendung (unter der Grenze für anfallsgefährdende Effekte). Die Lautstärke ist auf etwa 60 % begrenzt.
3. Danach kommt der Ende-Bildschirm mit dem restlichen Text, der Statistik, „Nochmal spielen“ und „Zur Raumauswahl“.

**Weitere Regeln für den Schreckmoment:**
- **Bewegung reduzieren:** Bei dieser Systemeinstellung erscheint das Licht sanfter (langsamer, weniger hell), der Ton bleibt.
- **Ton freigeben:** Beim Klick auf „Raum betreten“ wird die Tonausgabe einmal freigeschaltet (stummes Anspielen bzw. `AudioContext.resume()`). So darf der Ton später auch ohne direkten Klick erklingen, auch in Safari.
- **Ersatzton:** Solange keine Sounddatei vorhanden ist, erzeugt das Spiel einen kurzen Schreck-Ton selbst (Web Audio API: dumpfer Schlag mit Rauschen). Sobald `schreck.sound` eingetragen ist, wird die Datei abgespielt.
- **Mit Video:** Ist `verloren.video` eingetragen, ersetzt das Video Spannungsaufbau und Schreck. Der Text bleibt als Untertitel bzw. Ersatz.

### Dokumente
- `docs/ideen.md` anlegen (gibt es noch nicht). Eintrag „Raumübergreifende Geschichte mit Gesamträtsel am Ende“, Status **verworfen** (2026-10-04), Begründung im Wortlaut der Nutzerin: *„Spielende sollen die Räume einzeln und in beliebiger Reihenfolge spielen können, ohne die anderen bzw. eine Vorgeschichte kennen zu müssen. Außerdem kann man durch einzelne, unabhängige Räume komplett andere Themes, Geschichten und Rätsel je Raum simulieren. Dabei ist dann für jeden Geschmack etwas dabei.“*
- `docs/anleitung.md` anlegen:
  - **Grafik austauschen:** Dateiablage, Pfad in den Raumdaten eintragen, ggf. Position anpassen.
  - **Neuen Raum anlegen:**
    1. Raumdatei kopieren und `schwierigkeit` setzen (höher als bei den bisherigen Räumen).
    2. **Eigene Geschichte schreiben:** Intro, Outro (`gewonnen`) und `verloren`, jeweils als Text, optional mit Video. Inhaltlich eigenständig, ohne Bezug zu anderen Räumen.
    3. **Schreckmoment bewusst entscheiden:** `schreck: null` (aus) oder `{ sound: … }` (an, dann erscheint der Hinweis auf der Karte automatisch).
    4. **Eigene Ordner anlegen:** `public/bilder/<raum>/`, `public/videos/<raum>/`, `public/toene/<raum>/`.
    5. Den Raum in `shared/raeume/index.js` eintragen und mit `npm test` prüfen (die Tests melden fehlende Geschichte oder fehlendes `schreck`-Feld).
  - **Benötigte Dateien für das Arbeitszimmer:** Grafiken, Videos und Sound mit Dateiname, Format, Größe bzw. Länge und Motiv (siehe unten), dazu wie man sie einträgt.

### Benötigte Videos (Arbeitszimmer, optional)
Ablageort: `public/videos/arbeitszimmer/`. Alle aus der Ich-Perspektive der Studierenden.
- **Format:** MP4 (H.264-Video, AAC-Ton), 16:9, 1280×720 (reicht und hält die Dateien klein), etwa 2 Mbit/s, **empfohlen unter 8 MB pro Video**.
- **Videos:**
  - `intro.mp4`: 20–40 s. Man geht nachts durch den Uniflur, findet die angelehnte Tür und die brennende Lampe, tritt ein, die Tür fällt ins Schloss, das Zahlenschloss klickt.
  - `gewonnen.mp4`: 10–20 s. Das Schloss springt auf, ein Umschlag fällt aus dem Türspalt, man liest die grüne Schrift.
  - `verloren.mp4`: 8–15 s. Schritte, Stille, ein Schlüssel im Schloss, die Tür fliegt auf, Taschenlampe ins Gesicht, der Hausmeister ruft. Das Video enthält den Schreckmoment selbst und ersetzt den eingebauten.
- **Hinweis:** Gesprochener Text im Video sollte zum Untertitel-Text passen (oder das Video kommt ohne Sprache aus).

### Benötigter Sound (Arbeitszimmer)
- `public/toene/arbeitszimmer/schreck.mp3`: Schreckmoment. Die Tür wird aufgerissen, dazu ein kurzer, harter Akzent („Stinger“). 1–2 s, MP3 128 kbit/s, unter 100 KB, normalisiert (Spitze etwa −3 dB, kein Übersteuern). Bis die Datei da ist, wird ein selbst erzeugter Ersatzton verwendet.

### Benötigte Grafiken (Arbeitszimmer)
Alles funktioniert weiterhin mit Platzhaltern, die Bilder können jederzeit einzeln nachkommen. Ablageort: `public/bilder/arbeitszimmer/`.
- **4 Hintergründe** (1920×1080, JPG oder PNG, ohne Gegenstände): `hintergrund-raum` (Wand und Boden), `hintergrund-schreibtisch` (Tischplatte von oben), `hintergrund-pinnwand` (Korkwand), `hintergrund-bild` (Wand aus der Nähe)
- **13 Gegenstände** (PNG mit transparentem Hintergrund, etwa 800 px auf der langen Seite):
  - Hauptraum: Bücherregal, Gemälde, Pinnwand, Schreibtisch, Tür
  - Schreibtisch: Papierstapel, Kalender, Füllfederhalter
  - Pinnwand: Foto, Notiz, blauer Zettel
  - Gemälde: Hafenstadt-Gemälde, Rahmenecke
- **1 Vorschaubild** für die Startseite (1200×675)
- **Wichtig:** Die Spuren müssen auf den Bildern erkennbar sein: rote 4 in der Rahmenecke, grüne eingekreiste 1 im Kalender, blaue 7 auf dem Zettel, Notiz „Rot – Grün – Blau“. Alle Bilder sollten im gleichen Stil, aus gleicher Perspektive und mit gleichem Licht entstehen. Ein Vorschlag für einen Stil-Prompt steht in der Anleitung.

### Teilschritte (jeweils im Browser sichtbar, jeweils Commit, Doku und Push)
- **9a: Startseite und Schwierigkeitsgrade.** Raumliste, neue Felder, Startseite mit Raumkarte, Spiel unter `spiel.html`, Link „← Räume“, Test „Räume sind nach Schwierigkeit sortiert“.
  *Im Browser:* `localhost:3000` zeigt die Raumauswahl, „Spielen“ startet das Arbeitszimmer.
- **9b: Vorgeschichte.** Status `bereit` und Aktion `start` mit Tests, Modul `geschichte.js` (vorerst nur Text), Intro-Fenster, Abschluss- und Verloren-Text aus den Raumdaten, Knopf „Zur Raumauswahl“.
  *Im Browser:* Erst die Geschichte, dann „Raum betreten“ und der Timer läuft. Nach dem Sieg kommt die Nachricht des Professors.
- **9c: Schreckmoment und Video-Unterstützung.** Spannungsaufbau, Lichtkegel-Einblendung, Ersatzton bzw. Sounddatei, Ton-Freigabe bei „Raum betreten“, Video-Abspieler mit „Überspringen“, Untertitel, Rückfall auf Text und Autoplay-Behandlung. Hinweis auf der Raumkarte. Zum Testen nehme ich im Testbrowser ein kurzes WebM-Video auf (Canvas + MediaRecorder, da ffmpeg nicht installiert ist). Es liegt nur im Scratchpad, nicht im Projekt.
  *Im Browser:* Bei Zeitablauf baut sich Spannung auf, dann folgt der Schreck mit Licht und Ton.
- **9d: Anleitung und Dateiliste.** `docs/anleitung.md` mit Grafiken, Videos und Sound. Abschnitt 2 der Doku auf den Endstand der ersten Version bringen.

### Vor der Umsetzung (laut CLAUDE.md)
1. Diesen Plan als `docs/plaene/2026-10-04_startseite-und-vorgeschichte.md` speichern.
2. `docs/ideen.md` mit dem verworfenen Eintrag anlegen.
3. Planungseintrag in DOKUMENTATION.md, Entscheidungen in Abschnitt 3: eigenständige Räume mit festem Schwierigkeitsgrad, freie Wahl, zwei Seiten, Status `bereit`, Geschichte in den Raumdaten, jeder Raum mit eigener Geschichte (Intro und Outro als Text, optional als Video), Schreckmoment pro Raum ausdrücklich an oder aus (bei „an“ mit eingebautem Ersatzton, solange keine Datei da ist).
4. Commit „Doku: Planung zu Startseite und Vorgeschichte“ erstellen und pushen.

## Überprüfung
- `npm test`: Die bestehenden 25 Tests werden angepasst. Neu kommen Tests für `bereit`/`start`, die Sortierung nach Schwierigkeit, die vollständige Geschichte jedes Raums und das ausdrücklich gesetzte `schreck`-Feld dazu.
- Schreck abschalten: Im Testbrowser `schreck` auf `null` setzen und prüfen, dass weder Licht noch Ton noch der Karten-Hinweis erscheinen.
- Screenshots (Desktop und Handy quer): Startseite mit Schreck-Hinweis, Intro, laufendes Spiel nach „Raum betreten“ (Timer läuft erst ab dann), Sieg mit Abschlusstext, Zeitablauf in drei Phasen (Spannung, Lichtkegel, Ende-Bildschirm), „Zur Raumauswahl“, unbekannter Raum in der URL (Weiterleitung zur Startseite). Dabei auf JS-Fehler achten.
- Video: mit einem Testvideo im Scratchpad prüfen, ob es abgespielt wird, ob „Überspringen“ funktioniert und ob bei falschem Pfad der Text erscheint.
- Ton: Per Screenshot nicht prüfbar. Ich kontrolliere per Skript, dass der Ton ohne Fehler gestartet wird. Hören musst du ihn selbst im Browser.
