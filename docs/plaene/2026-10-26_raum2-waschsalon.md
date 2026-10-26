<!-- Freigegeben von der Nutzerin am 2026-10-26 (Plan-Modus). -->

# Plan: Raum 2 „Letzter Waschgang“ (AP 6, erste Version)

## Kontext
Raum 2 ist ein Waschsalon der 80er Jahre (Referenzbild der Nutzerin), der fröhlich beginnt und unheimlich wird.
Ziel ist eine anfängerfreundliche Umsetzung mit derselben Grundstruktur und Bedienung wie Raum 1:
- dasselbe Raumdatenformat
- Zoom-Detailansichten mit Zurück-Navigation
- Notizbuch, Timer, Tipps und dasselbe Backend

Es gibt keine separate Spielsteuerung, kein Inventarsystem und kein neues Feld im Spielstand. Alle Zustände
leiten sich aus den gefundenen Spuren ab. Grafiken, Video, Stimme und Musik der Nutzerin folgen später.
Bis dahin gibt es Platzhalter.

## Entscheidungen aus den Rückfragen
| Thema | Entscheidung |
|---|---|
| Geschichte | Die freundliche Stimme am Telefon ist die Falle (übernatürlich) |
| Umfang | 5 Schritte, 15 Minuten, Schwierigkeit 2, 4 Tipps à 60 s |
| UV-Lampe | Die Spur „UV-Lampe“ genügt als Voraussetzung; in passenden Detailansichten erscheint ein Knopf „UV-Licht an“ |
| Finale | Maschine 7 mit der richtigen Programmfolge starten, also genau das Verbotene |
| Lichter | Farbe → Programmschritt (Schlüssel unter UV), dazu der Hinweis „rückwärts“ |
| Telefon | nur Hörer abheben (Anruf als Text, später als Ton), kein Wählrätsel |
| Zusatzobjekte | Eingangstür und eigener Wäschekorb, jeweils Text mit Zustand |
| Darstellung | einfache SVG-Kulisse und austauschbare Platzhalter; Zustände möglichst per CSS-Klasse |
| Enden | gewonnen offen-unheimlich; verloren mit Schreckmoment (zunächst Ersatzton) |
| Intro | erst Text, das Video folgt später |
| Ton in Version 1 | Klingeln, Anruf, Maschine (fehlende Dateien bleiben stumm). Der Stummschalter gilt für alle Töne, auch für den vorhandenen Schreckton. Bei Spielende enden Klingeln und Maschinenbrummen; der Schreckton danach spielt bei eingeschaltetem Ton weiterhin |
| Lichtstimmung | an das dunklere Referenzbild angelehnt (Neonlicht, beiges Drehscheibentelefon auf türkisfarbenem Wandbord); der Raum wird nicht allgemein aufgehellt. Der freundliche Eindruck entsteht durch Musik, die Alltagssituation und ruhig leuchtende Deko |
| Stimmung | nach dem Anruf eine dezent kühlere Farbgebung per CSS; Flackern zurückgestellt |
| Lichtfolge | 1 Sekunde pro Farbe, danach 3 Sekunden Pause, dann Wiederholung; Phase nach der Serveruhr |
| Commits | wie in Raum 1: kurze, beschreibende Nachrichten auf Deutsch, „Doku: …“ für Doku-Commits; kein `feat:`/`fix:`/`docs:` (Korrektur der Nutzerin vom 2026-10-26, ersetzt den kurzzeitigen Wunsch nach englischen Conventional Commits) |

## Geschichte
- **Raum:** `id: "waschsalon"`, Titel „Letzter Waschgang“.
- **Kurzbeschreibung:** „Ein verregneter Abend im Waschsalon der 80er. Bunte Lichter, Synth-Pop – und ein Telefon, das klingelt, obwohl niemand weiß, dass du hier bist.“
- **Intro** („Nur noch eine Ladung“):
  1. Freitag, 13. November 1987, kurz vor elf. Es regnet seit Stunden, und deine Waschmaschine zu Hause hat aufgegeben.
  2. Der Waschsalon „Sonnenschein“ an der Ecke hat noch Licht. Das Türglöckchen bimmelt, aus dem Radio läuft Synth-Pop, bunte Glühbirnen hängen über den Maschinen. Niemand sonst ist hier.
  3. Du stellst deinen vollen Wäschekorb ab und siehst dich nach einer freien Maschine um. Da klingelt das beige Telefon auf dem türkisfarbenen Wandbord.
- **Anruf** (Hörer abheben): „Gut, du bist noch da. Bitte starte keine Maschine. Setz dich einfach hin und warte. Es dauert nicht lange.“ Hinter dir springt Maschine 8 an.
- **Unheimliche Verlagerung** (beabsichtigt, über Text und Zustände sichtbar):
  - Vor dem Anruf ist der Korb voll: „Deine Wäsche, frisch abgestellt. Der rote Pullover liegt obenauf.“
  - Maschine 8 ist vor dem Anruf leer.
  - Nach dem Anruf ist der Korb leer: „Leer. Eben lag deine Wäsche noch darin, du hast sie nicht angerührt.“
  - Maschine 8 nach dem Anruf: „Hinter dem Bullauge dreht sich deine Wäsche, der rote Pullover. Du hast sie nicht hineingelegt. Die Tür ist verriegelt, das Display zeigt: LETZTER WASCHGANG.“
  - Eingangstür nach dem Anruf: „Abgeschlossen. Ein Magnet summt im Rahmen.“
- **Gewonnen:** Maschine 7 springt an. Maschine 8 ruckt, bleibt stehen und dreht langsam rückwärts. Ihre Tür springt auf, die Wäsche ist warm und trocken, vorn klackt das Magnetschloss. „Du trittst hinaus in den Regen. Hinter dir klingelt das Telefon. Du drehst dich nicht um.“
- **Verloren:**
  - Spannung: „Das Brummen wird lauter. Maschine 8 schleudert, schneller, immer schneller. Die Lichter gehen aus …“
  - Schreck: `{ sound: null }`, später `toene/waschsalon/schreck.mp3`.
  - Text: „Am nächsten Morgen findet die erste Kundin auf dem Tresen einen Korb frisch gefalteter Wäsche. Sie ist noch warm. Auf dem Kassenbon daneben: Maschine 8 · Letzter Waschgang.“

## Rätsel (vollständig)
**Farbe → Programm** (steht nur unter UV-Licht auf der Programmtafel)

| Farbe | Programm | Tasten-ID |
|---|---|---|
| Gelb | Vorwäsche | `vor` |
| Rot | Hauptwäsche | `haupt` |
| Blau | Spülen | `spuelen` |
| Grün | Schleudern | `schleudern` |

**Lichtfolge** (nach dem Anruf): Blau – Gelb – Rot – Grün – Rot, je 1 Sekunde. Danach 3 Sekunden Pause, dann von
vorn (ein Durchlauf dauert 8 Sekunden).
Das entspricht Spülen – Vorwäsche – Hauptwäsche – Schleudern – Hauptwäsche.

**Lösung (rückwärts)** an Maschine 7: Hauptwäsche – Schleudern – Hauptwäsche – Vorwäsche – Spülen.
Geheim: `"haupt-schleudern-haupt-vor-spuelen"`.

**Fundorte** (alle ohne Tipps erreichbar):

| Hinweis | Fundort | Spur |
|---|---|---|
| Was passiert, Verbot | Telefon → Hörer | `anruf` |
| Die UV-Lampe existiert und wofür sie gut ist | UV-Lampe auf dem Tisch: „Eine UV-Taschenlampe. Damit sieht man Waschmittelreste und unsichtbare Schrift.“ | `uv-lampe` |
| Wo man suchen soll | Programmtafel am Automaten: „Vorwäsche, Hauptwäsche, Spülen, Schleudern, jeweils mit Symbol. Die Farbspalte daneben ist verblichen, als hätte jemand mit Waschmittel darübergewischt. Unten: Inh. I. Lenz.“ Der UV-Knopf erscheint nur hier. | – |
| Farbschlüssel, Umkehr, Maschine 7 | Leuchtende Notiz (nur unter UV) auf der Programmtafel: „Gelb Vorwäsche · Rot Hauptwäsche · Blau Spülen · Grün Schleudern. Glaub ihr nicht. Die Lichter zeigen ihr Programm. Gib es rückwärts an Maschine 7 ein und starte sie. – M., 1986“ | `farbschluessel` |
| Lichtfolge, Startpunkt | Lichterkette, Detailansicht: Birnen mit Farbnamen. Text: „Seit dem Anruf blinken sie immer dieselbe Folge. Nach der langen Pause beginnt sie von vorn.“ Dauerhaft sichtbarer Hinweis in der Ansicht: „Die Folge beginnt nach der langen Pause“, weil man die Ansicht mitten im Ablauf öffnen kann | `lichter` |
| Eingabe | Maschine 7 → Bedienfeld: „Maschine 7 ist frei. Vier Programmtasten mit Symbol und Namen, ein Startknopf.“ | Rätsel `programm` (Ausgang) |

Das Backend prüft Voraussetzungen: `farbschluessel` braucht `uv-lampe`, `lichter` braucht `anruf`.

**Tipps** (geheim):
1. Die Lampe auf dem Tisch ist eine UV-Lampe. Leuchte damit die Programmtafel am Automaten an.
2. Die Farben der Lichterkette stehen für Programmschritte. Den Schlüssel findest du unter UV-Licht auf der Programmtafel.
3. Die Lichter zeigen Spülen, Vorwäsche, Hauptwäsche, Schleudern, Hauptwäsche. Gib das von hinten nach vorn an Maschine 7 ein.
4. Lösung: Hauptwäsche, Schleudern, Hauptwäsche, Vorwäsche, Spülen, dann Start.

## Raum und Szenen
Bühne 16:9, Positionen in Prozent nach dem Referenzbild (Feinabstimmung später mit den Grafiken).

**Gesamtansicht `raum`.** Die Kulisse `bilder/waschsalon/hintergrund-raum.svg` zeigt nur feste Einrichtung:
Fliesen, Pastellstreifen, Fenster mit Regen, Schachbrettboden, Neonröhre, Deko-Maschinenreihe links, Maschine 9
mit Wäschewagen, Stühle, Wandlampe, Fußmatte, Tisch vorne und die Türöffnung. Sie zeigt keines der Objekte unten.

| Objekt | Lage etwa (x/y/b/h) | Klick | Nach `anruf` |
|---|---|---|---|
| Lichterkette | 30/9/35/13 | Zoom `lichterkette` | Birnen blinken die Folge |
| Maschine 7 | 37/33/8/20 | Zoom `maschine7` | – |
| Maschine 8 | 45/33/8/20 | Text (leer, frei) | Text (deine Wäsche, nicht von dir hineingelegt), Klasse `laeuft` |
| Waschmittelautomat | 65/24/7/34 | Zoom `automat` | – |
| Telefon (beige Drehscheibe, türkisfarbenes Wandbord) | 76/25/7/9 | Zoom `telefon` | Klasse `klingelt` nur bis zum Anruf |
| Eingangstür | 84/0/16/80 | Text („Draußen regnet es“) | Text (verriegelt) |
| UV-Lampe (auf dem Tisch) | 9/73/11/8 | Spur `uv-lampe` | – (verschwindet, sobald gefunden) |
| Wäschekorb | 37/79/13/21 | Text (voll) | Text (leer), Klasse `leer`, später Bild `korb-leer.webp` |

**Detailansichten** (CSS-Platzhalter, später eigene Grafiken):
- `telefon`: Hörer (Spur `anruf`, Text des Anrufs; ein erneuter Klick zeigt ihn erneut).
- `lichterkette`: vier große Birnen mit Farbnamen (Spur `lichter`; vor dem Anruf Text „Sie leuchten ruhig“).
- `automat`: Programmtafel (Text) und Leuchtende Notiz (nur unter UV). Szene mit UV-Funktion.
- `maschine7`: Bullauge (Text) und Bedienfeld (Rätsel `programm`, Ausgang).

## Neue Datenfelder (bewusst wenige)
- `sichtbarAb` und `sichtbarBis: "<spur>"`: Objekt erst ab bzw. nur bis zu einer Spur sichtbar (UV-Lampe).
- `klasse: "<css>"` und `nachSpur: { spur, text?, bild?, klasse? }`: Text, Bild bzw. Klasse ändern sich ab einer Spur. Die Aktion eines Objekts wechselt nicht.
- `aktion.voraussetzung: "<spur>"` bei `findeSpur`; das Backend prüft sie.
- Szene `uv: true` und Objekt `nurUV: true`.
- `lichter: { birnen: [{ farbe, name, x, y }], folge, taktMs: 1000, pauseMs: 3000, abSpur: "anruf" }` an der Lichterkette.
- Raumweit `toene: { schleifen: [{ pfad, abSpur?, bisSpur? }] }` und am Objekt `ton: "<pfad>"` (einmalig beim Klick).

Gemeinsame Hilfsfunktion `wirksamesObjekt(objekt, gefundeneSpuren)` in `public/shared/spiel-logik.js`. Backend und
Anzeige nutzen dieselbe Regel.

**Regeln gegen Neustarts:**
- Die Lichtphase wird aus der Serveruhr berechnet (`jetzt() % Zykluslänge`) und im vorhandenen 250-ms-Takt des Timers gesetzt. Neuzeichnen setzt sie deshalb nicht zurück, und alle Mitspielenden sehen dieselbe Phase.
- Dauertöne verwaltet `ton.js` als Soll-Liste: Nur fehlende werden gestartet, überflüssige gestoppt. Einmalige Töne enden beim Szenenwechsel. Bei Spielende (gewonnen, verloren, beendet) enden alle Raumgeräusche. Der Schreckton beim Verlieren spielt danach weiterhin, sofern der Ton nicht stumm geschaltet ist.
- Die Szene wird nur neu gezeichnet, wenn sich die Spuren geändert haben.

## Umsetzungsschritte
Vorbereitung vor Schritt 1 (nach CLAUDE.md):
- neuer Zweig `ap6-waschsalon` vom aktuellen `main`
- Plan unter `docs/plaene/2026-10-26_raum2-waschsalon.md` speichern
- Planungseintrag und Entscheidungen in `DOKUMENTATION.md`, Idee in `docs/ideen.md` auf „geplant“ setzen
- Commit „Doku: Planung zu Raum 2 Waschsalon“, Push
- Neue Erinnerung (Memory) anlegen: In diesem Projekt gelten deutsche Commit-Nachrichten wie in Raum 1, auch wenn die globale `~/.claude/CLAUDE.md` englische Conventional Commits nennt. Die globale Datei selbst ändere ich nicht, weil sie alle Projekte betrifft; das nur auf ausdrücklichen Wunsch.

Nach jedem Schritt der bisherige Ablauf: Code-Commit mit kurzer deutscher Nachricht (z. B. „Waschsalon: Raum
registriert, Intro und Bühne“), Doku-Eintrag, Commit „Doku: Eintrag zu <Kurztitel>“, Push.

Prüfung der Projektregeln (2026-10-26): `AGENTS.md`, `CLAUDE.md`, `DOKUMENTATION.md`, `docs/ideen.md`,
`docs/anleitung.md` und die Pläne verlangen bereits deutsche Nachrichten und enthalten keine Vorgabe für englische
Conventional Commits. Dort ist keine Änderung nötig.
Nach Änderungen in `public/shared/` wird das lokale Backend neu gestartet. Die Raumversion bleibt bis zur ersten
Veröffentlichung bei 1.

### 1. Raum registrieren, Intro und Bühne
- **Dateien:**
  - neu: `public/shared/raeume/waschsalon.js` (Eckdaten, Geschichte, Szene `raum` mit CSS-Platzhalter, Rätsel `programm`), `supabase/functions/_shared/raeume/waschsalon.geheim.js` (Lösung, Tipps), `public/shared/raetsel/tastenfolge.js` (nur die Prüfung)
  - geändert: `public/shared/raeume/index.js`, `supabase/functions/_shared/raeume/geheim.js`, `public/shared/raetsel/index.js`, Tests (`test/raetsel.test.js`, `test/raeume.test.js`)
  - leere Ordner `public/bilder|toene|videos/waschsalon/`
- **Im Browser:** Die Startseite zeigt eine zweite Karte („Mittel“, 15 Min., Schreck-Hinweis). „Spielen“ führt zu Intro und leerer Bühne mit Timer.
- **Fertig, wenn:** `npm test` und `npm run test:backend` grün sind, eine Sitzung für den Waschsalon erstellt und gestartet werden kann und Raum 1 unverändert startet.

### 2. SVG-Kulisse
- **Dateien:** neu `public/bilder/waschsalon/hintergrund-raum.svg` (viewBox 1920×1080, flach und stimmig, nicht fotorealistisch); `waschsalon.js` (Feld `hintergrund`).
- **Lichtstimmung:** Helligkeit und Farben wie im dunkleren Referenzbild:
  - Nacht draußen mit pinkfarbenen und cyanfarbenen Neonreflexen auf nassen Scheiben und Boden
  - kühles Licht der Neonröhre, warmes Licht der Wandlampe, gedämpfte Pastellfliesen
  - kein allgemeines Aufhellen
- **Im Browser:** Eine abendliche Waschsalon-Kulisse in gedämpften Pastell- und Neonfarben, sie skaliert sauber mit der Bühne.
- **Fertig, wenn:** Keines der interaktiven Objekte ist eingezeichnet, die Datei ist klein (etwa unter 100 KB), und der Austausch gegen eine Rastergrafik erfordert nur eine Änderung des Pfads.

### 3. Platzhalter und Zoom-Detailansichten
- **Dateien:** `waschsalon.js` (alle Objekte mit `bild: null`, Emoji, Text; Szenen `telefon`, `lichterkette`, `automat`, `maschine7`), `public/css/style.css` (zwei neue Platzhalter-Hintergründe, z. B. `fliesen`, `metall`).
- **Im Browser:** Alle acht Objekte liegen an ihren Plätzen. Vier Objekte zoomen in ihre Detailansicht, der Zurück-Knopf führt zurück, die übrigen zeigen ihren Text.
- **Fertig, wenn:** Jeder Klick eine erkennbare Reaktion hat, es keine funktionslosen Flächen gibt und Zoom und Zurück wie in Raum 1 funktionieren.

### 4. Anruf als Text, Spuren und Zustände
- **Dateien:** `public/shared/spiel-logik.js` (`wirksamesObjekt`, `voraussetzung`), `public/js/anzeige.js` (Zeichnen mit Spielstand, Neuzeichnen bei neuen Spuren, Klasse und Sichtbarkeit), `public/js/main.js` (wirksames Objekt beim Klick, aktuelle Szene merken), `waschsalon.js` (Spuren, `nachSpur`, `sichtbarBis`), `public/css/style.css` (Klassen `klingelt`, `laeuft`, `leer` als schlichte Markierungen), `test/spiel-logik.test.js`.
- **Im Browser:** Das Telefon ist als klingelnd markiert. Nach dem Abheben erscheint der Anruf im Notizbuch, der Korb ist leer, Maschine 8 läuft mit deiner Wäsche, die Tür ist verriegelt. Die UV-Lampe verschwindet nach dem Anklicken.
- **Fertig, wenn:** Die Zustände nach dem Schließen und Öffnen von Detailansichten und nach dem Neuladen erhalten bleiben und die Tests für Voraussetzung und `nachSpur` grün sind.

### 5. UV-Funktion
- **Dateien:** `public/spiel.html` (Knopf „UV-Licht an/aus“ auf der Bühne), `anzeige.js` und `main.js` (Knopf nur bei `uv: true` und gefundener `uv-lampe`, beim Szenenwechsel aus), `style.css` (Klasse `uv-an`: violetter Filter, `nurUV`-Objekte sichtbar), `waschsalon.js` (Leuchtende Notiz).
- **Im Browser:** Ohne Lampe gibt es keinen Knopf. Mit Lampe erscheint die Notiz auf der Programmtafel, und ein Klick trägt den Farbschlüssel ein.
- **Fertig, wenn:** Das Backend die Spur `farbschluessel` ohne `uv-lampe` ablehnt (Test) und UV nur im eigenen Browser wirkt.

### 6. Lichtfolge
- **Dateien:** `anzeige.js` (Birnen zeichnen, Phase im vorhandenen Timer-Takt), `style.css` (Birnen, Leuchten), `waschsalon.js` (Feld `lichter` an beiden Lichterketten, Spur `lichter`).
- **Im Browser:**
  - Vor dem Anruf leuchten alle Birnen ruhig.
  - Danach leuchtet jede Farbe 1 Sekunde, nach der Folge kommen 3 Sekunden Pause, dann geht es von vorn los.
  - In der Detailansicht stehen Farbnamen unter den Birnen und der Hinweis „Die Folge beginnt nach der langen Pause“.
- **Fertig, wenn:**
  - das Tempo stimmt (8 Sekunden pro Durchlauf),
  - die Folge beim Szenenwechsel und Neuzeichnen nicht neu beginnt,
  - sie in zwei Fenstern gleich läuft
  - und bei „Bewegung reduzieren“ ohne Übergänge auskommt.

### 7. Tastenrätsel, Tipps und beide Enden
- **Dateien:** neu `public/js/tastenfeld.js` (Tasten mit Symbol und Namen, eingegebene Folge, Löschen, Start, Fehlermeldung mit Wackeln); `public/spiel.html` (Dialog), `main.js` (`RAETSEL_ANZEIGEN`), `anzeige.js` (Fehlversuch auch für das Tastenfeld melden), `style.css`, `waschsalon.js` (Texte der Enden), `waschsalon.geheim.js` (endgültige Tipps).
- **Im Browser:** Die richtige Folge gewinnt für alle. Eine falsche zeigt „Die Maschine brummt kurz und verstummt.“ Bei Zeitablauf laufen Spannung, Schreck und Endtext. Die Tipps lassen sich holen.
- **Fertig, wenn:** Gewinn und Verlust jeweils einmal vollständig durchgespielt sind.

### 8. Ton und einfache Stimmungsänderung
- **Dateien:**
  - neu `public/js/ton.js` (Stumm-Zustand für alle Töne)
  - `public/js/geschichte.js` (Schreckton und Ersatzton beachten den Stumm-Zustand)
  - `spiel.html` (Stummschalter in der Kopfleiste)
  - `anzeige.js` und `main.js` (Soll-Liste der Schleifen nach jedem Spielstand, einmaliger Anruf-Ton, Stopp beim Szenenwechsel, Raumgeräusche bei Spielende beenden)
  - `waschsalon.js` (`toene`: `klingeln.mp3` bis `anruf`, `maschine.mp3` ab `anruf`; Hörer `ton: anruf.mp3`)
  - `style.css` (Klasse `stimmung-kippt` ab `anruf`: dezent kühlere Farbgebung, ohne Flackern und ohne Aufhellen)
- **Im Browser:**
  - Mit Dateien klingelt das Telefon, nach dem Abheben brummt die Maschine.
  - Bei Spielende verstummen Klingeln und Brummen. Beim Verlieren folgt der Schreckton, außer bei Stummschaltung.
  - Ohne Dateien bleibt es still und fehlerfrei.
  - Stumm wirkt sofort auf alle Töne und bleibt beim Neuladen erhalten.
- **Fertig, wenn:**
  - das Klingeln nach dem Abheben bei allen endet,
  - Töne beim Neuzeichnen nicht doppelt starten
  - und Stumm auch den Schreckton unterdrückt (geprüft in Raum 1 und Raum 2).

## Abschlusstests (verbindlich)
1. Kompletter Durchlauf bis zum Gewinn, ohne Tipps.
2. Zeitablauf mit Spannung, Schreck und Endtext.
3. Mehrspieler-Abgleich mit zwei Browserfenstern: Anruf, Zustände, Lichtfolge, Gewinn und Klingeln stimmen bei beiden überein.
4. Detailansichten mehrfach schließen und erneut öffnen, dazu Neuladen: Spuren und Zustände bleiben erhalten.
5. Ohne Audiodateien: keine Fehler in der Konsole, das Spiel bleibt vollständig lösbar.
   Mit Ton: Bei Spielende enden die Raumgeräusche. Stumm unterdrückt alle Töne, auch den Schreckton.
6. Handyansicht (schmale Breite): Bühne, Knöpfe, Tastenfeld und UV-Knopf sind bedienbar.
7. Raum 1 funktioniert unverändert.
8. `npm test` und `npm run test:backend` grün.

## Zurückgestellt
- Flackern und weitere Animationen (drehende Trommel, Regen)
- Display von Maschine 8 mit Restzeit
- Musik, Sprachaufnahme, Intro-Video
- Grafiken der Nutzerin, eigene Klickflächen gegen transparente Ränder
- Karussell der Startseite
- Deploy nur nach Freigabe
