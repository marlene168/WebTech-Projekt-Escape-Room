# Anleitung: Grafiken, Videos, Ton und neue Räume

Diese Anleitung beschreibt, wie man Platzhalter durch echte Dateien ersetzt und wie man einen neuen Raum anlegt.
Alles funktioniert auch ohne diese Dateien. Solange ein Feld `null` ist, erscheint der Platzhalter bzw. der Text (was bei einem falschen Pfad passiert, steht in Abschnitt 2 und 3).

---

## 1. Spiel starten

```bash
npm install   # einmalig
npm start     # danach http://localhost:3000 öffnen
npm test      # prüft Spiellogik und Raumdaten
```

### Backend lokal (Supabase in Docker)

Für den Mehrspieler-Modus läuft lokal ein eigenes Supabase in Docker. Es ist unabhängig vom Cloud-Projekt, dort wird nichts verändert.

Voraussetzung ist Docker Desktop, gestartet und mit dem Befehl `docker` im Terminal. Falls `docker` nicht gefunden wird: In Docker Desktop unter *Settings → Advanced* die Option „System (requires password)“ wählen.

```bash
npm run backend:start   # Supabase starten und Datenbank frisch aus den Migrationen aufbauen
npm run test:backend    # Backend-Tests (Sitzungen, Rechte, Gleichzeitigkeit, Realtime)
npm run backend:stop    # Supabase wieder beenden
```

Beim ersten Start lädt Docker einige Images herunter, das dauert ein paar Minuten. Die lokale Verwaltungsoberfläche (Supabase Studio) ist dann unter http://127.0.0.1:54323 erreichbar.

**Online spielen (lokal):** Backend starten, dann `npm start` und http://localhost:3000 öffnen. „Spielen“ erstellt eine Sitzung, der angezeigte Code lässt bis zu drei weitere Personen beitreten (nur vor dem Start). Zum Ausprobieren mit mehreren Personen einen zweiten Browser oder ein privates Fenster nehmen, denn jedes Fenster mit eigenem Speicher ist ein eigener Gast.

**Wichtig nach Änderungen an geteilten Dateien:** Die Edge Functions nutzen Dateien aus `public/shared/` (Spiellogik, Raumdaten). Nach Änderungen dort oder nach dem Verschieben von Dateien das Backend neu starten (`npm run backend:stop`, dann `npm run backend:start`). Sonst arbeiten die Edge Functions mit dem alten Stand oder finden Dateien nicht.

### Online-Testversion einrichten (einmalig)

Die vollständigen Einrichtungsschritte stehen im [Detailplan AP 5](plaene/2026-10-23_ap5-testumgebung.md), Abschnitt 5. Für das Supabase-Token gelten feste Einstellungen.

**Supabase-Token `github-deploy-test`** (Supabase → Account → Access Tokens):

| Einstellung | Wert |
|---|---|
| Zugriff auf Projekte | ausschließlich `escape-room-test` |
| Project Settings | Read |
| API Keys | Read |
| API Key Secrets | Read |
| Edge Functions | Read-write |
| alle übrigen Berechtigungen | None |
| Ablaufdatum | 22.10.2027 (danach neues Token erstellen und das GitHub-Secret ersetzen) |

Die drei Leserechte braucht `supabase link`, das Schreibrecht braucht die Veröffentlichung der Edge Functions. Datenbankmigrationen nutzen separat das Datenbank-Passwort. Der Tokenwert wird **nur** als GitHub-Secret `TEST_SUPABASE_ACCESS_TOKEN` hinterlegt, nie in Dateien, Git oder Protokollen.


### Online-Testversion aktualisieren (Deployment per Knopf)

Die Testversion liegt unter **https://escape-room-test-mauve.vercel.app**. Sie ist geschützt: Öffnen können sie nur das Konto der Inhaberin und ein ausdrücklich freigeschaltetes zweites Vercel-Konto. Die öffentliche Version gibt es erst nach ausdrücklicher Freigabe.

**Auslösen:** GitHub → **Actions** → **Deploy** → **Run workflow** → Branch `main`, Ziel `test`. Ein Push löst nie ein Deployment aus.

**Ablauf** (jeder Schritt nur nach Erfolg des vorigen, alle mit demselben Commit):
1. Prüfung: nur von `main`.
2. Dieselben Tests wie die CI.
3. Supabase: Migrationen, dann Edge Functions.
4. Vercel: Website, nur `public/`.
5. Rauchtest: Zugriffsschutz, Website, Upload, Backend, CAPTCHA.

Das Ergebnis steht in der Zusammenfassung des Laufs. Es läuft nie mehr als ein Deployment gleichzeitig, und ein laufendes wird nie abgebrochen.

**Wenn ein Schritt fehlschlägt:**
- Der Ablauf stoppt, die Zusammenfassung zeigt, was schon erledigt ist.
- Nichts wird automatisch zurückgesetzt, auch nicht die Datenbank.
- Ursache gezielt beheben (auf einem Branch, mit Pull Request) und den Workflow erneut auslösen. Migrationen und Edge Functions lassen sich gefahrlos erneut ausführen.

**Verträglichkeitsregel:** Das Backend wird vor der Website aktualisiert, die vorherige Website läuft also kurz gegen das neue Backend. Backend-Änderungen müssen deshalb mit der vorherigen Website funktionieren: nur ergänzen, nichts entfernen oder umbenennen. Nötige Umbauten werden auf zwei Deployments verteilt.

**Nur über die Hauptadresse spielen:** Die Adressen einzelner Deployments (`escape-room-test-…-web-tech-escape-room.vercel.app`) sind bewusst nicht mit dem Backend verbunden und daher nicht spielbar.

**Zweites Konto (externe Freischaltung):** Mit dem zweiten Vercel-Konto die Hauptadresse öffnen und Zugriff anfragen, dann im Vercel-Projekt unter **Settings → Deployment Protection → Requests** freigeben.

**Checkliste vor Tests und Präsentationen:**
1. Im Supabase-Dashboard den Status des Projekts `escape-room-test` prüfen. Ist es pausiert (kostenlose Projekte pausieren nach etwa einer Woche ohne Nutzung), wiederherstellen und einige Minuten warten.
2. Die Testversion öffnen, „Spielen“ klicken, eine Sitzung erstellen und **den Raum betreten**. Erst ein vollständiger Spielstart zeigt, dass alles läuft, nur das Dashboard zu öffnen genügt nicht.
3. Bei Bedarf den Deploy-Workflow erneut auslösen und den Rauchtest abwarten.

---

## 2. Grafik austauschen

1. Datei in den Bilderordner des Raums legen, z. B. `public/bilder/arbeitszimmer/schreibtisch.png`.
2. In der Raumdatei (`public/shared/raeume/arbeitszimmer.js`) beim Objekt den Pfad eintragen, **ohne** `public/`:
   ```js
   bild: "bilder/arbeitszimmer/schreibtisch.png",
   ```
   Bei einem Hintergrund steht der Pfad bei der Szene im Feld `hintergrund`, beim Vorschaubild für die Startseite im Feld `vorschaubild`.
3. Seite neu laden. Stimmt der Pfad nicht, erscheint bei **Gegenständen** weiter der Platzhalter. Bei **Hintergründen** und beim **Vorschaubild** bleibt die Fläche dagegen leer (dunkel). Dann Pfad und Dateinamen prüfen.

**Groß- und Kleinschreibung beachten:** Lokal auf dem Mac ist `Schreibtisch.PNG` dasselbe wie `schreibtisch.png`, online bei Vercel nicht. Dateinamen deshalb klein schreiben und genau so in die Raumdatei eintragen. Keine Leerzeichen und Umlaute in Dateinamen.

**Dateigröße:** Große Bilder vor dem Einbinden verkleinern. Gegenstände am besten als **WebP mit Transparenz** (lange Seite höchstens 1200 px, Qualität etwa 85), Hintergründe als JPG (1920×1080, Qualität etwa 80). Die Originale aus dem Bildgenerator (oft 2–3 MB pro PNG) gehören nicht in `public/`, sonst lädt die Seite unnötig lange.

**Versteckte Klickfläche:** Ist ein Detail schon im Bild darunter zu sehen (z. B. die rote 4 in der Rahmenecke des Gemäldes), bekommt das Objekt statt eines Bildes `unsichtbar: true`. Es wird dann ohne Bild, Platzhalter und Tooltip gezeichnet und ist nur anklickbar. Steht es in der Raumdatei direkt hinter dem Objekt, auf dem es liegt, leuchtet dieses beim Darüberfahren weiter, damit die Stelle sich nicht verrät.

**Größe und Position:** Jedes Objekt hat einen Kasten (`x`, `y`, `breite`, `hoehe` in Prozent der Bühne). Das Bild wird in diesen Kasten eingepasst, ohne verzerrt zu werden. Hat das Bild ein anderes Seitenverhältnis als der Kasten, bleibt an zwei Seiten etwas Rand frei. Dann entweder das Bild passend zuschneiden oder `breite`/`hoehe` in der Raumdatei anpassen. Die empfohlenen Seitenverhältnisse stehen in der Tabelle in Abschnitt 5.

---

## 3. Video oder Ton einbinden

- **Video:** Datei nach `public/videos/<raum>/` legen und beim jeweiligen Geschichtsteil eintragen:
  ```js
  geschichte: {
    intro:    { …, video: "videos/arbeitszimmer/intro.mp4" },
    gewonnen: { …, video: "videos/arbeitszimmer/gewonnen.mp4" },
    verloren: { …, video: "videos/arbeitszimmer/verloren.mp4" },
  }
  ```
  - Das **Intro-Video** startet erst, wenn man auf „▶ Geschichte ansehen“ klickt, weil Browser Ton erst nach einem Klick erlauben.
  - **Outro- und Verloren-Video** starten von selbst. Blockiert der Browser das, erscheint „▶ Abspielen“.
  - Jedes Video lässt sich mit „Überspringen ⏭“ beenden.
  - Der Text der Geschichte bleibt als Untertitel stehen. Lädt das Video nicht, wird nur der Text gezeigt.
  - Das **Verloren-Video ersetzt den eingebauten Schreckmoment**, muss den Schreck also selbst enthalten.
- **Schreck-Ton:** Datei nach `public/toene/<raum>/` legen und eintragen:
  ```js
  schreck: { sound: "toene/arbeitszimmer/schreck.mp3" },
  ```
  Solange `sound: null` gilt, erzeugt das Spiel einen eingebauten Ersatzton. MP3 ist das empfohlene Format, WAV und M4A (AAC) funktionieren in aktuellen Browsern ebenfalls.
- **Autoplay-Sperre der Browser:** Ton darf erst nach einer Nutzeraktion auf der Seite spielen. Der Schreck-Ton wird deshalb beim **ersten Klick oder Tastendruck auf der Spielseite** freigeschaltet (bei der erstellenden Person spätestens mit „Raum betreten“). Wer bis zum Zeitablauf gar nicht auf die Spielseite klickt, hört keinen Ton. Licht und Text erscheinen trotzdem. Lädt die Datei nicht, spielt der eingebaute Ersatzton.

---

## 4. Neuen Raum anlegen

Jeder Raum ist **inhaltlich eigenständig**: eigene Geschichte, eigenes Thema, eigene Rätsel, ohne Bezug zu anderen Räumen.

1. **Raumdateien anlegen:** Jeder Raum besteht aus zwei Dateien:
   - **öffentlich**: `public/shared/raeume/arbeitszimmer.js` kopieren, z. B. nach `public/shared/raeume/labor.js`. Darin `id`, `version: 1`, `titel`, `kurzbeschreibung`, `dauerSekunden`, Szenen, Objekte, Spuren, Rätsel (`raetsel`, ohne Lösungen), `ausgang` und `anzahlTipps` anpassen.
   - **geheim** (nur im Backend, wird nie an den Browser ausgeliefert): `supabase/functions/_shared/raeume/arbeitszimmer.geheim.js` kopieren, z. B. nach `supabase/functions/_shared/raeume/labor.geheim.js`. Darin stehen die Lösungen (`loesungen`, je Rätsel) und die Tipp-Texte (`tipps`). Die Datei in `supabase/functions/_shared/raeume/geheim.js` eintragen.

   Jedes Rätsel hat einen `typ` aus `public/shared/raetsel/` (bisher: `zahlenschloss` mit `stellen` = Anzahl der Rädchen). Ein neuer Rätseltyp braucht ein eigenes Modul in `public/shared/raetsel/` und eine Anzeige in `public/js/main.js`.

   **Raumversion:** Ändern sich später Rätsel oder Lösungen eines Raums, `version` um 1 erhöhen.
2. **Schwierigkeit festlegen:** `schwierigkeit: 1` (leicht), `2` (mittel) oder `3` (schwer). Spätere Räume sind schwerer als frühere, also mindestens so schwer wie der letzte Raum in der Liste.
3. **Eigene Geschichte schreiben:** Jeder Raum braucht
   - ein **Intro** (`geschichte.intro`: `titel` und `text`),
   - ein **Outro** (`geschichte.gewonnen`: `text`), das nach dem Sieg die Geschichte des Raums abschließt,
   - ein **Ende bei Zeitablauf** (`geschichte.verloren`: `text`, optional `spannung` für den Spannungsaufbau).

   Jeder Teil kann zusätzlich ein Video bekommen (`video`, sonst `null`). Texte sind Listen von Absätzen.
4. **Schreckmoment bewusst entscheiden** (Pflichtfeld `geschichte.verloren.schreck`):
   - `schreck: null`: kein Schreckmoment, kein Licht, kein Ton, kein Hinweis auf der Raumkarte.
   - `schreck: { sound: null }`: Schreckmoment mit eingebautem Ersatzton.
   - `schreck: { sound: "toene/<raum>/schreck.mp3" }`: Schreckmoment mit eigener Datei.

   Bei einem Schreckmoment erscheint auf der Raumkarte automatisch „⚠ Enthält einen Schreckmoment mit Ton“.
5. **Eigene Ordner anlegen:** `public/bilder/<raum>/`, `public/videos/<raum>/`, `public/toene/<raum>/`.
6. **Raum eintragen:** In `public/shared/raeume/index.js` importieren und **hinten** an die Liste `raeume` anhängen.
7. **Prüfen:** `npm test` ausführen. Die Tests melden zum Beispiel eine fehlende Geschichte, ein fehlendes `schreck`-Feld, einen ungültigen Schwierigkeitsgrad, einen Raum, der leichter ist als sein Vorgänger, eine fehlende Lösung oder eine Lösung bzw. einen Tipp-Text in der öffentlichen Raumdatei.

---

## 5. Benötigte Dateien für „Das Arbeitszimmer des Professors“

### Grafiken
**Stand 2026-10-23 (vorläufige Einbindung):** Der Raum nutzt eine Gesamtansicht mit allen fünf Gegenständen als Hintergrund (`hintergrund-raum.jpg`). Die Gegenstände liegen als eigene WebP-Dateien (`regal.webp`, `gemaelde.webp`, `pinnwand.webp`, `schreibtisch.webp`, `tuer.webp`) deckungsgleich darüber, ihre Kästen in der Raumdatei sind darauf abgestimmt. Das Vorschaubild `vorschau.jpg` ist die verkleinerte Gesamtansicht.

**Stand 2026-10-26:** Die Gegenstände der Detailansichten sind eingebunden: `papiere.webp`, `kalender.webp`, `fueller.webp`, `foto.webp`, `notiz.webp`, `blauer-zettel.webp`. Das Gemälde der Nahansicht ist `gemaelde-nah.webp`: das Gemälde in 1600 px Breite mit einer per Skript eingesetzten roten 4 in der unteren rechten Rahmenecke. Die Rahmenecke ist eine versteckte Klickfläche, eine Lupe gibt es nicht. **Hintergründe der Detailansichten:** `hintergrund-schreibtisch.jpg` (Lederunterlage von oben) und `hintergrund-pinnwand.jpg` (Korkwand mit Karte, Zettel und Skizze). Das Gemälde bekommt bewusst keinen eigenen Hintergrund, dort bleibt der Platzhalter „Tapete“. **Noch offen:** der Schreck-Ton.

Ablage: `public/bilder/arbeitszimmer/`. Alle Grafiken sollten im **gleichen Stil**, aus der **gleichen Perspektive** und mit dem **gleichen Licht** entstehen.

**Hintergründe** (1920×1080 px, JPG oder PNG, **ohne** die anklickbaren Gegenstände):

| Datei | Feld in der Raumdatei | Motiv |
|---|---|---|
| `hintergrund-raum.jpg` | `szenen.raum.hintergrund` | Arbeitszimmer frontal: Wand mit dunkelgrüner Streifentapete, Holzdielenboden, nachts, warmes Licht einer Schreibtischlampe |
| `hintergrund-schreibtisch.jpg` | `szenen.schreibtisch.hintergrund` | Schreibtischplatte aus dunklem Eichenholz von oben, Lichtkegel der Lampe |
| `hintergrund-pinnwand.jpg` | `szenen.pinnwand.hintergrund` | Korkwand mit dunklem Holzrahmen, frontal, bildfüllend |
| ~~`hintergrund-bild.jpg`~~ | `szenen.bild.hintergrund` | Entfällt: Platzhalter „Tapete“ genügt (Entscheidung der Nutzerin vom 2026-10-26) |

**Gegenstände** (PNG mit **transparentem Hintergrund**, lange Seite etwa 800 px). Das Seitenverhältnis sollte ungefähr dem Kasten im Spiel entsprechen:

| Datei | Objekt (`id`) | Szene | Seitenverhältnis (B : H) | Motiv / was erkennbar sein muss |
|---|---|---|---|---|
| `regal.png` | `regal` | Raum | 1 : 2,1 (hochkant) | Hohes Bücherregal mit alten Büchern |
| `gemaelde.png` | `bild` | Raum | 1,1 : 1 | Gerahmtes Ölgemälde einer Hafenstadt mit Leuchtturm (klein, an der Wand) |
| `pinnwand.png` | `pinnwand` | Raum | 1,3 : 1 | Pinnwand mit Zetteln und Fotos (aus der Entfernung) |
| `schreibtisch.png` | `schreibtisch` | Raum | 2,1 : 1 (breit) | Schwerer Eichenschreibtisch mit Papieren und Lampe |
| `tuer.png` | `tuer` | Raum | 1 : 2,25 (hochkant) | Holztür mit Zahlenschloss aus Messing |
| `papiere.png` | `papiere` | Schreibtisch | 1,25 : 1 | Papierstapel mit Sternbild-Skizzen und einem Brief |
| `kalender.png` | `kalender` | Schreibtisch | 1 : 1 | Tischkalender, Oktober, **der 1. grün eingekreist** |
| `fueller.png` | `fueller` | Schreibtisch | 1,6 : 1 | Füllfederhalter mit grüner Tinte |
| `foto.png` | `foto` | Pinnwand | 1 : 1 | Foto eines älteren Professors vor einem Hafen |
| `notiz.png` | `notiz` | Pinnwand | 1,25 : 1 | Handschriftliche Notiz: **„Rot – Grün – Blau“** |
| `blauer-zettel.png` | `blauer-zettel` | Pinnwand | 1 : 1 | Kleiner blauer Haftzettel mit einer großen **7** |
| `hafenstadt.png` | `gemaelde` | Gemälde | 1,25 : 1 | Das Gemälde aus der Nähe: Hafenstadt, Schiffe, Leuchtturm, Goldrahmen |
| ~~`rahmenecke.png`~~ | `rahmenecke` | Gemälde | – | Entfällt: versteckte Klickfläche über der roten 4 in `gemaelde-nah.webp` |

**Vorschaubild** für die Startseite: `vorschau.jpg`, 1200×675 px, Feld `vorschaubild`. Stimmungsvolle Ansicht des Arbeitszimmers.

**Wichtig:** Die Spuren müssen gut lesbar sein: rote 4, grüne 1, blaue 7 und die Notiz „Rot – Grün – Blau“. KI-Bildgeneratoren schreiben Text und Ziffern oft fehlerhaft, deshalb lieber genau prüfen oder Ziffern nachträglich ergänzen.

**Vorschlag für einen Stil-Prompt** (jeweils um das Motiv ergänzen):
> Stimmungsvolle digitale Illustration im Stil eines Point-and-Click-Adventures, Arbeitszimmer eines Professors bei Nacht, warmes gelbliches Licht einer Schreibtischlampe von links, dunkles Eichenholz, Messing, dunkelgrüne Streifentapete, leicht erhöhte Frontalansicht, detailreich, keine Personen, [Motiv], freigestellt auf transparentem Hintergrund

Erzeugt das Werkzeug keinen transparenten Hintergrund, lässt er sich nachträglich entfernen, z. B. mit der Funktion „Hintergrund entfernen“ in neueren Versionen der macOS-App Vorschau.

### Videos (optional)
Ablage: `public/videos/arbeitszimmer/`. Alle aus der **Ich-Perspektive der Studierenden**.

- **Format:** MP4 (H.264-Video, AAC-Ton), 16:9, 1280×720 px, etwa 2 Mbit/s
- **Dateigröße:** **unter 8 MB pro Video** empfohlen (kurze Ladezeit, auch später beim Hosting)

| Datei | Feld | Länge | Motiv |
|---|---|---|---|
| `intro.mp4` | `geschichte.intro.video` | 20–40 s | Nachts durch einen leeren Uniflur gehen, eine angelehnte Bürotür entdecken, drinnen brennt eine Schreibtischlampe. Eintreten, die Tür fällt hinter einem zu, das Zahlenschloss klickt. |
| `gewonnen.mp4` | `geschichte.gewonnen.video` | 10–20 s | Das Zahlenschloss springt auf, die Tür öffnet sich einen Spalt, ein Umschlag fällt heraus. Man hebt ihn auf und liest die Zeilen in grüner Tinte. |
| `verloren.mp4` | `geschichte.verloren.video` | 8–15 s | Stille, Schritte auf dem Flur, die vor der Tür stehen bleiben. Ein Schlüssel dreht sich, die Tür fliegt auf, grelles Taschenlampenlicht ins Gesicht, der Hausmeister ruft „Was machen Sie hier drin?!“. **Enthält den Schreckmoment selbst** (ersetzt den eingebauten). Bitte kein schnelles Flackern. |

Gesprochener Text im Video sollte zum Text der Geschichte passen, oder das Video kommt ohne Sprache aus.

### Ton
Ablage: `public/toene/arbeitszimmer/`.

| Datei | Feld | Format | Inhalt |
|---|---|---|---|
| `schreck.mp3` | `geschichte.verloren.schreck.sound` | MP3, 128 kbit/s, 1–2 s, unter 100 KB, normalisiert (Spitze etwa −3 dB, nicht übersteuert) | Tür wird aufgerissen, dazu ein kurzer, harter Schreck-Akzent („Stinger“) |
