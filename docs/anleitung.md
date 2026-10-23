# Anleitung: Grafiken, Videos, Ton und neue Räume

Diese Anleitung beschreibt, wie man Platzhalter durch echte Dateien ersetzt und wie man einen neuen Raum anlegt.
Alles funktioniert auch ohne diese Dateien. Fehlt eine Datei, erscheint automatisch der Platzhalter bzw. der Text.

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

---

## 2. Grafik austauschen

1. Datei in den Bilderordner des Raums legen, z. B. `public/bilder/arbeitszimmer/schreibtisch.png`.
2. In der Raumdatei (`public/shared/raeume/arbeitszimmer.js`) beim Objekt den Pfad eintragen, **ohne** `public/`:
   ```js
   bild: "bilder/arbeitszimmer/schreibtisch.png",
   ```
   Bei einem Hintergrund steht der Pfad bei der Szene im Feld `hintergrund`, beim Vorschaubild für die Startseite im Feld `vorschaubild`.
3. Seite neu laden. Stimmt der Pfad nicht, erscheint weiter der Platzhalter.

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
  Solange `sound: null` gilt, erzeugt das Spiel einen eingebauten Ersatzton.

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
Ablage: `public/bilder/arbeitszimmer/`. Alle Grafiken sollten im **gleichen Stil**, aus der **gleichen Perspektive** und mit dem **gleichen Licht** entstehen.

**Hintergründe** (1920×1080 px, JPG oder PNG, **ohne** die anklickbaren Gegenstände):

| Datei | Feld in der Raumdatei | Motiv |
|---|---|---|
| `hintergrund-raum.jpg` | `szenen.raum.hintergrund` | Arbeitszimmer frontal: Wand mit dunkelgrüner Streifentapete, Holzdielenboden, nachts, warmes Licht einer Schreibtischlampe |
| `hintergrund-schreibtisch.jpg` | `szenen.schreibtisch.hintergrund` | Schreibtischplatte aus dunklem Eichenholz von oben, Lichtkegel der Lampe |
| `hintergrund-pinnwand.jpg` | `szenen.pinnwand.hintergrund` | Korkwand mit dunklem Holzrahmen, frontal, bildfüllend |
| `hintergrund-bild.jpg` | `szenen.bild.hintergrund` | Tapete aus der Nähe (Hintergrund für das Gemälde) |

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
| `rahmenecke.png` | `rahmenecke` | Gemälde | 1 : 1 | Untere rechte Rahmenecke mit einer eingeritzten **roten 4** |

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
