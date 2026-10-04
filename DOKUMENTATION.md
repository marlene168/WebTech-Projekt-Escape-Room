# Projektdokumentation: Escape-Room

> Diese Datei wird während der Entwicklung fortlaufend von Claude Code gepflegt (Regeln siehe `CLAUDE.md`).
> Einträge im Entwicklungsprotokoll werden nur angehängt und nachträglich nicht verändert.
> Jeder Eintrag verweist auf den zugehörigen Git-Commit im GitHub-Repository.

## 1. Projektüberblick
- **Ziel der App:** Entwicklung einer browserbasierten WebApp, die das Erlebnis eines Escape Rooms digital simuliert. Spielende wählen einen Raum aus und versuchen, durch das Untersuchen anklickbarer Objekte und das Kombinieren von Hinweisen ein Rätsel unter Zeitdruck zu lösen. Als Erweiterung sind mehrere Räume mit unterschiedlichen Themen und Schwierigkeitsgraden vorgesehen.
- **Rahmen:** Seminar-/Projektarbeit, Web Technologie 
- **Zeitraum:** Start 03.10.2026 – laufend
- **Tech-Stack:** HTML, CSS, JavaScript (ES-Module, ohne Framework); Node.js mit Express als Server; Tests mit `node:test`; später Socket.IO für den Mehrspieler-Modus (geplant)
- **Werkzeuge:** VS Code, Claude Code, Git, GitHub, Node.js/npm, Google Chrome (Headless-Screenshots zur Sichtprüfung)
- **Repository:** https://github.com/marlene168/WebTech-Projekt-Escape-Room

## 2. Aktueller Stand
- **Funktionen:** Ein Node.js/Express-Server liefert die Seite aus. Sie zeigt eine Kopfleiste mit Raumtitel und eine 16:9-Spielbühne mit Platzhalter-Hintergrund (Tapete, Holzboden), die sich an jede Fenstergröße anpasst. Im Arbeitszimmer stehen fünf klickbare Objekte (Bücherregal, Gemälde, Pinnwand, Schreibtisch, Tür), zunächst als Platzhalter mit Emoji und Namen. Ein Klick zeigt die Beschreibung in einem Textfenster. Schreibtisch, Pinnwand und Gemälde öffnen per Zoom-Animation eine Detailansicht mit eigenen Objekten; ein Zurück-Knopf zoomt wieder heraus. Fünf Objekte in den Detailansichten liefern Spuren. Diese landen im Notizbuch (Knopf mit Zähler in der Kopfleiste), und bereits untersuchte Objekte mit Spur tragen ein Häkchen. Auf Handys im Hochformat erscheint der Hinweis, das Gerät quer zu halten. Starten mit `npm install` (einmalig) und `npm start`, dann `http://localhost:3000` öffnen. Tests: `npm test`.
- **Ordnerstruktur:**
  - `server.js` – Webserver (liefert `public/` und `shared/` aus)
  - `public/` – alles, was der Browser anzeigt (HTML, CSS, JavaScript, Bilder)
  - `public/js/` – `main.js` (Einstieg), `anzeige.js` (zeichnet Szenen, Objekte, Textfenster, Notizbuch), `verbindung-lokal.js` (führt die Spiellogik im Browser aus; später durch eine Online-Verbindung ersetzbar)
  - `shared/spiel-logik.js` – Spielregeln als reine Funktionen (Spielstand + Aktion → neuer Spielstand)
  - `shared/raeume/` – Raumdaten, ein Raum pro Datei
  - `test/` – Tests der Spiellogik (`node:test`)
  - `docs/plaene/` – freigegebene Pläne
- **Wichtigste Dateien:** `server.js`, `public/index.html`, `public/css/style.css`, `public/js/anzeige.js`, `public/js/main.js`, `shared/spiel-logik.js`, `shared/raeume/arbeitszimmer.js`, `package.json`
- **Grafik austauschen:** In `shared/raeume/arbeitszimmer.js` beim Objekt `bild` (bzw. bei der Szene `hintergrund`) den Pfad zur Datei eintragen, z. B. `"bilder/arbeitszimmer/schreibtisch.png"`, und die Datei unter `public/bilder/arbeitszimmer/` ablegen.

## 3. Wichtige Entscheidungen
| Datum | Entscheidung | Begründung | Verworfene Alternativen |
|-------|--------------|------------|-------------------------|
| 2026-10-03 | Git-Identität mit GitHub-noreply-Adresse, nur lokal für dieses Repo | Private E-Mail bleibt in der öffentlichen Git-Historie verborgen; Einstellung betrifft nur dieses Projekt | Gmail-Adresse; globale Git-Konfiguration |
| 2026-10-04 | Größere Aufgaben zuerst im Plan-Modus planen; freigegebene Pläne unter `docs/plaene/` ablegen und als eigene Planungseinträge protokollieren | Planungsphase und Entscheidungswege werden nachvollziehbar belegt; Umsetzung lässt sich gegen den Plan prüfen (Abweichungen werden dokumentiert) | Direkte Umsetzung ohne schriftlichen Plan; Plan nur im Chat bzw. nur im Protokolleintrag festhalten |
| 2026-10-04 | Frontend mit HTML, CSS und JavaScript ohne Framework (ES-Module, kein Build-Werkzeug) | Nutzerin ist Einsteigerin; die Grundlagen lernen passt zum WebTech-Seminar; wenige Werkzeuge, jede Zeile nachvollziehbar | Vue (zusätzliche Lernkurve, Build-Werkzeug nötig); React (am schwersten zu lernen, zu viel Overhead für eine kleine App) |
| 2026-10-04 | Kleiner Node.js-Server mit Express ab der ersten Version; Port aus `process.env.PORT` | Mehrspieler-Modus (Socket.IO) und Hosting kommen später ohne Umbau dazu; überall JavaScript; Node ist bereits installiert | Nur statische Dateien mit Live Server (Server müsste später nachgerüstet werden, reine Datei-Hosts können keinen Mehrspieler-Modus) |
| 2026-10-04 | Mehrspieler-Modell für später: gemeinsamer Raum, live synchron, Beitritt per Raum-Code | Kommt einem echten Escape Room am nächsten; technisch gut machbar | Verteilte Informationen pro Person (jedes Rätsel muss eigens entworfen werden); Wettbewerb mit Rangliste (kein gemeinsames Spielen) |
| 2026-10-04 | Architektur: Räume als Daten (`shared/raeume/`), Spiellogik als reine Funktionen (`shared/spiel-logik.js`), Verbindungsschicht zwischen Anzeige und Logik (zuerst lokal, später online); Timer über Startzeit statt herunterzählender Variable; aktuelle Szene nur lokal pro Gerät | Weitere Räume brauchen nur eine neue Datendatei; Server kann später dieselbe Logik ausführen; Anzeige bleibt beim Wechsel zum Mehrspieler-Modus unverändert; alle Geräte zeigen dieselbe Zeit | Logik direkt in den Klick-Handlern (müsste für Mehrspieler komplett umgebaut werden); Räume fest im Code |
| 2026-10-04 | Darstellung: 16:9-Bühne mit nicht klickbarem Hintergrundbild, darüber jeder Gegenstand als eigenes klickbares Element (Positionen in Prozent), Platzhalter bis zu den KI-generierten PNGs; Klick auf Gegenstände zoomt in Detailansichten | Wunsch der Nutzerin nach atmosphärischem Raum mit einzeln austauschbaren Grafiken; Prozentwerte halten Grafiken auf allen Bildschirmgrößen an derselben Stelle | Ein Hintergrundbild mit unsichtbaren Klickflächen (fummelige Platzierung, Grafiken nicht einzeln austauschbar) |
| 2026-10-04 | Hinweise als Spuren in Objekten (Notizbuch) plus Hilfe-Knopf mit gestuften Tipps gegen Zeitstrafe; bei Ablauf des Timers ist das Spiel vorbei | Wer festhängt, kommt weiter, aber Hilfe hat einen Preis; eindeutiges Spielende wie im echten Escape Room | Nur Spuren ohne Hilfe; Hilfe ohne Strafe; Weiterspielen mit Überzeit |

## 4. Entwicklungsprotokoll (chronologisch)

<!--
VORLAGE FÜR JEDEN NEUEN EINTRAG (nicht löschen, Einträge darunter anhängen):

### JJJJ-MM-TT, HH:MM – Kurztitel der Aufgabe
- **Auslöser:** Anweisung/Idee des Nutzers: „…“ ODER Vorschlag von Claude: …
- **Durchgeführte Schritte:** …
- **Geänderte/neue Dateien:** `…`
- **Genutzte Tools:** …
- **Probleme & Lösungen:** … (oder: keine)
- **Ergebnis:** …
- **Bezug zur Planung:** JJJJ-MM-TT, HH:MM – Planung: … (oder: keiner)
- **Abweichungen vom Plan:** … (oder: keine)
- **Git-Commit:** `abc1234`
-->

<!--
VORLAGE FÜR PLANUNGSEINTRÄGE (nicht löschen, Einträge darunter anhängen):

### JJJJ-MM-TT, HH:MM – Planung: Kurztitel der Aufgabe
- **Auslöser:** Anweisung/Idee des Nutzers: „…“ ODER Vorschlag von Claude: …
- **Ausgangsidee:** …
- **Rückfragen & Antworten:**
  - Frage: … → Antwort: …
- **Kurzfassung des Plans:** …
- **Plandatei:** [`docs/plaene/JJJJ-MM-TT_kurztitel.md`](docs/plaene/JJJJ-MM-TT_kurztitel.md)
- **Verworfene Ideen & Alternativen:** …
- **Git-Commit:** `abc1234`
-->

### 2026-10-03, 23:51 – Dokumentationssystem eingerichtet
- **Auslöser:** Anweisung des Nutzers: „Lies zuerst CLAUDE.md und DOKUMENTATION.md. Lege dann eine passende .gitignore für dieses Projekt an (Mac-Systemdateien wie .DS_Store, R-Dateien wie .Rhistory und was für eine WebApp typisch ist). Prüfe, ob das Repository schon mit GitHub verbunden ist, und richte das andernfalls mit mir zusammen ein. Committe danach CLAUDE.md, DOKUMENTATION.md und .gitignore und schreibe den ersten Doku-Eintrag: Dokumentationssystem eingerichtet.“
- **Durchgeführte Schritte:** CLAUDE.md und DOKUMENTATION.md gelesen; `.gitignore` angelegt (macOS, R/RStudio, Node, Build-Ausgaben, `.env`, Editor-Dateien, Logs); GitHub-Verbindung geprüft (Remote `origin` war bereits gesetzt und erreichbar, Repository noch leer); fehlende Git-Identität nach Rückfrage lokal mit GitHub-noreply-Adresse gesetzt; erster Commit erstellt; Repository-Link in Abschnitt 1 und Entscheidung in Abschnitt 3 eingetragen.
- **Geänderte/neue Dateien:** `.gitignore`, `CLAUDE.md`, `DOKUMENTATION.md`
- **Genutzte Tools:** Claude Code, Git, GitHub-API (Abfrage der öffentlichen Nutzer-ID für die noreply-Adresse)
- **Probleme & Lösungen:** Git hatte keinen Namen/keine E-Mail konfiguriert, Commit war daher nicht möglich → mit der Nutzerin abgestimmt und lokal gesetzt.
- **Ergebnis:** Repository ist versioniert, mit GitHub verbunden und das Dokumentationssystem ist einsatzbereit.
- **Git-Commit:** `f0f275d`

### 2026-10-04, 01:23 – Ablauf für den Plan-Modus festgelegt
- **Auslöser:** Anweisung des Nutzers: „Ich werde größere Aufgaben künftig immer zuerst im Plan-Modus planen und erst nach Freigabe umsetzen. Ergänze bitte CLAUDE.md um folgenden Abschnitt (wörtlich übernehmen): Arbeiten mit dem Plan-Modus […] Ergänze außerdem in DOKUMENTATION.md die Vorlage im Kommentar um die beiden Felder „Bezug zur Planung“ und „Abweichungen vom Plan“, und lege daneben eine zweite Vorlage für Planungseinträge an.“
- **Durchgeführte Schritte:** Abschnitt „Arbeiten mit dem Plan-Modus“ wortgetreu in CLAUDE.md eingefügt (zwischen „Ablauf nach jeder abgeschlossenen Aufgabe“ und „Dokumentation“), dabei als Markdown-Überschrift und nummerierte Liste formatiert; Protokollvorlage in DOKUMENTATION.md um „Bezug zur Planung“ und „Abweichungen vom Plan“ ergänzt; zweite Vorlage für Planungseinträge angelegt; Entscheidung in Abschnitt 3 eingetragen.
- **Geänderte/neue Dateien:** `CLAUDE.md`, `DOKUMENTATION.md`
- **Genutzte Tools:** Claude Code, Git
- **Probleme & Lösungen:** Der übergebene Text hatte keine Markdown-Formatierung mehr → Wortlaut unverändert übernommen, nur Überschrift, Nummerierung und Code-Formatierung für Pfad und Befehl ergänzt.
- **Ergebnis:** Der Ablauf für Planung, Freigabe und Dokumentation größerer Aufgaben ist festgelegt; die Vorlagen für Protokoll- und Planungseinträge sind vorhanden.
- **Bezug zur Planung:** keiner
- **Abweichungen vom Plan:** keine
- **Git-Commit:** `e9d4ac6`

### 2026-10-04, 02:07 – Planung: Erste Version der Escape-Room-WebApp
- **Auslöser:** Anweisung des Nutzers: „Lies DOKUMENTATION.md, dort steht das Ziel meiner Escape-Room-WebApp. Langfristig soll die App online gehostet werden, und mehrere Personen sollen von verschiedenen Geräten aus gemeinsam spielen können. Wir planen jetzt aber zuerst eine bewusst einfache erste Version: ein Raum, ein Spieler, wenige anklickbare Objekte, Hinweise, ein Rätsel und ein Timer. […] Ich bin Anfänger und kenne Frameworks wie Vue oder React noch nicht: Erkläre bei technischen Entscheidungen kurz die Vor- und Nachteile und gib mir eine Empfehlung. Wähle den Aufbau so, dass Hosting, Mehrspieler-Modus und weitere Räume später ohne kompletten Umbau ergänzt werden können. Teile die Umsetzung der ersten Version in kleine Schritte auf, nach denen ich jeweils im Browser sehen kann, was sich geändert hat.“
- **Ausgangsidee:** Einfache Einzelspieler-Version mit einem Raum, deren Aufbau spätere Erweiterungen (Hosting, Mehrspieler, weitere Räume) ohne Umbau erlaubt.
- **Rückfragen & Antworten:**
  - Frage: Womit soll die Oberfläche gebaut werden (HTML/CSS/JS pur, Vue, React)? → Antwort: HTML/CSS/JS pur (Empfehlung übernommen)
  - Frage: Soll schon in Version 1 ein kleiner Server dabei sein? → Antwort: Ja, Node.js ab Schritt 1 (Empfehlung übernommen)
  - Frage: Wie soll das gemeinsame Spielen später aussehen? → Antwort: Gemeinsamer Raum, live synchron (Empfehlung übernommen)
  - Frage: Gibt es Vorgaben vom Seminar zur Technik? → Antwort: Keine Vorgaben
  - Frage: Welches Thema soll der erste Raum haben? → Antwort: Arbeitszimmer
  - Frage: Wie soll der Raum dargestellt werden? → Antwort: Einzelne Objekte, jeder Gegenstand ein eigenes klickbares Element, keine unsichtbaren Klickflächen. Das Aussehen ist sehr wichtig: Ein reines Hintergrundbild (Wände, Boden, nicht klickbar) liegt unter den Gegenständen. Die Gegenstände werden später KI-generierte PNGs mit transparentem Hintergrund, in Version 1 reichen Platzhalter, jede Grafik soll einzeln austauschbar sein. Ein Klick auf Gegenstände wie Tisch, Pinnwand oder Bild soll in eine Detailansicht hineinzoomen, in der man nach Hinweisen sucht.
  - Frage: Was sollen „Hinweise“ im Spiel sein? → Antwort: Spuren in Objekten plus Hilfe-Knopf mit Zeitstrafe (Empfehlung übernommen)
  - Frage: Was passiert, wenn der Timer abläuft? → Antwort: Spiel vorbei mit Neustart-Knopf (Empfehlung übernommen)
- **Kurzfassung des Plans:** Node.js/Express-Server liefert eine Frontend-App ohne Framework aus. Räume werden als Daten beschrieben (`shared/raeume/`), die Spiellogik besteht aus reinen Funktionen (`shared/spiel-logik.js`), und eine Verbindungsschicht trennt Anzeige und Logik (zuerst lokal, später Socket.IO). Die Anzeige ist eine 16:9-Bühne mit Hintergrundbild und einzeln austauschbaren Objektgrafiken (zuerst Platzhalter) sowie Zoom in Detailansichten. Das Rätsel ist ein 3-stelliges Zahlenschloss an der Tür (Code aus farbigen Ziffern in Bild, Schreibtisch und Pinnwand). Dazu kommen ein Notizbuch für Spuren, ein Hilfe-Knopf mit gestuften Tipps gegen Zeitstrafe und ein 10-Minuten-Timer. Umsetzung in 9 Schritten, die jeweils im Browser sichtbar sind: Gerüst, Bühne, Objekte, Detailansichten, Spiellogik/Notizbuch, Zahlenschloss, Timer, Hilfe-Knopf, Startseite.
- **Plandatei:** [`docs/plaene/2026-10-04_erste-version.md`](docs/plaene/2026-10-04_erste-version.md)
- **Verworfene Ideen & Alternativen:** Vue bzw. React als Framework; reine statische Dateien ohne Server; Mehrspieler mit verteilten Informationen oder als Wettbewerb; ein Raumbild mit unsichtbaren Klickflächen; Hinweise ohne Hilfe-Knopf bzw. Hilfe ohne Strafe; Weiterspielen mit Überzeit; die Themen Labor und Piratenkajüte.
- **Git-Commit:** wird mit diesem Eintrag erstellt (siehe Commit „Doku: Planung zu erste Version“)

### 2026-10-04, 02:08 – Schritt 1: Projektgerüst und Server
- **Auslöser:** Anweisung des Nutzers: Freigabe des Plans „Erste Version der Escape-Room-WebApp“; dies ist Schritt 1 des Plans.
- **Durchgeführte Schritte:** `package.json` angelegt (ES-Module, Startskript `npm start`); Express installiert; `server.js` geschrieben, der `public/` und unter `/shared` den Ordner `shared/` ausliefert und den Port aus `PORT` liest (Standard 3000); einfache `public/index.html` als Platzhalter angelegt; Server testweise gestartet und Seite per `curl` abgerufen (HTTP 200); Abschnitt 2 „Aktueller Stand“ aktualisiert.
- **Geänderte/neue Dateien:** `package.json`, `package-lock.json`, `server.js`, `public/index.html`, `DOKUMENTATION.md`
- **Genutzte Tools:** Claude Code, npm, Node.js, curl, Git
- **Probleme & Lösungen:** keine
- **Ergebnis:** Mit `npm start` läuft der Server, unter `http://localhost:3000` erscheint die Seite „Escape Room“.
- **Bezug zur Planung:** 2026-10-04, 02:07 – Planung: Erste Version der Escape-Room-WebApp
- **Abweichungen vom Plan:** keine
- **Git-Commit:** `0dfbc36`

### 2026-10-04, 02:17 – Schritt 2: Spielbühne
- **Auslöser:** Anweisung des Nutzers: „mach bitte mit schritt zwei weiter“ (Schritt 2 des freigegebenen Plans).
- **Durchgeführte Schritte:** `public/index.html` um Kopfleiste mit Raumtitel und eine Spielbühne erweitert; `public/css/style.css` angelegt. Die Bühne behält immer das Seitenverhältnis 16:9 und wird so groß wie möglich (Container-Query-Einheiten `cqw`/`cqh`). Als Platzhalter-Hintergrund dient ein CSS-Farbverlauf (gestreifte Tapete, Holzdielen, dunkle Vignette). Farben sind als CSS-Variablen festgelegt. Auslieferung von Seite und CSS per `curl` geprüft (HTTP 200).
- **Geänderte/neue Dateien:** `public/index.html`, `public/css/style.css`, `DOKUMENTATION.md`
- **Genutzte Tools:** Claude Code, Node.js, curl, Git
- **Probleme & Lösungen:** Ein automatischer Screenshot zur Sichtprüfung war nicht möglich (kein Chrome installiert) → Sichtprüfung übernimmt die Nutzerin im Browser.
- **Ergebnis:** Ein dunkler „Raum“ füllt das Fenster unter der Kopfleiste und behält beim Verkleinern seine Form.
- **Bezug zur Planung:** 2026-10-04, 02:07 – Planung: Erste Version der Escape-Room-WebApp
- **Abweichungen vom Plan:** keine
- **Git-Commit:** `a0ca820`

### 2026-10-04, 02:23 – Sichtprüfung per Screenshot eingeführt
- **Auslöser:** Anweisung des Nutzers: „Chrome ist jetzt installiert, prüfe das Aussehen künftig bitte selbst per Screenshot.“
- **Durchgeführte Schritte:** Server auf einem Testport gestartet. Mit Google Chrome im Headless-Modus wurden Screenshots von Schritt 2 in Desktop-Größe (1280×800) und Handy-Größe hochkant (390×844) aufgenommen und ausgewertet. Die Arbeitsweise wurde als dauerhafte Vorgabe für Claude gespeichert. Chrome ist in Abschnitt 1 unter „Werkzeuge“ ergänzt.
- **Geänderte/neue Dateien:** `DOKUMENTATION.md`
- **Genutzte Tools:** Claude Code, Google Chrome (headless), Node.js
- **Probleme & Lösungen:** Die Prüfung ergab: Auf dem Desktop füllt die Bühne die Breite wie geplant. Auf einem Handy im Hochformat ist die 16:9-Bühne nur ein schmaler Streifen und zum Spielen zu klein → als offener Punkt an die Nutzerin gemeldet, noch nicht geändert.
- **Ergebnis:** Ab jetzt prüft Claude das Aussehen nach jeder sichtbaren Änderung selbst per Screenshot (Desktop und Handy).
- **Bezug zur Planung:** keiner
- **Abweichungen vom Plan:** keine
- **Git-Commit:** keiner (keine Code-Änderung)

### 2026-10-04, 02:26 – Schritt 3: Raumdaten und Objekte
- **Auslöser:** Anweisung des Nutzers: „Ja mach es so und mach mit schritt drei weiter“. Damit stimmte sie auch dem Vorschlag von Claude zu, auf Handys im Hochformat den Hinweis „Bitte Gerät quer halten“ einzublenden.
- **Durchgeführte Schritte:**
  - `shared/raeume/arbeitszimmer.js` mit Titel, Startszene und fünf Objekten angelegt. Jedes Objekt hat Name, Emoji, optionalen Bildpfad, Position und Größe in Prozent sowie einen Beschreibungstext.
  - `public/js/anzeige.js` geschrieben. Es zeichnet Hintergrund und Objekte; Objekte sind Knöpfe, also auch per Tastatur bedienbar. Ohne Bild oder bei fehlender Bilddatei erscheint automatisch ein Platzhalter. Beschreibungen erscheinen in einem Textfenster (`<dialog>`).
  - `public/js/main.js` als Einstiegspunkt angelegt.
  - Im CSS ergänzt: Hover-Effekt (leichtes Vergrößern und goldener Schein), Gestaltung des Textfensters, Drehhinweis per Media Query, schmalere Kopfleiste auf niedrigen Bildschirmen.
  - Für die Sichtprüfung ein Hilfsskript im Scratchpad geschrieben (nicht im Projekt). Es steuert Chrome über das DevTools-Protokoll, sodass auch Zustände nach einem Klick fotografiert und JS-Fehler erkannt werden.
  - Abschnitt 2 aktualisiert.
- **Geänderte/neue Dateien:** `shared/raeume/arbeitszimmer.js`, `public/js/anzeige.js`, `public/js/main.js`, `public/index.html`, `public/css/style.css`, `DOKUMENTATION.md`
- **Genutzte Tools:** Claude Code, Node.js, Google Chrome (headless, DevTools-Protokoll), Git
- **Probleme & Lösungen:** Laut Screenshot nahm die Kopfleiste auf dem Handy im Querformat (844×390) viel Höhe weg und machte den Raum unnötig klein → Kopfleiste bei Bildschirmhöhen unter 500 px verkleinert, danach erneut geprüft. Für den Schreibtisch gibt es kein passendes Emoji → Stuhl-Emoji als Platzhalter, wird ohnehin durch eine Grafik ersetzt.
- **Ergebnis:** Desktop: Fünf Objekte stehen im Raum und reagieren auf Hover und Klick; das Textfenster zeigt die Beschreibung. Handy quer: Der Raum füllt die Höhe. Handy hochkant: Drehhinweis. In keiner Ansicht gab es JS-Fehler.
- **Bezug zur Planung:** 2026-10-04, 02:07 – Planung: Erste Version der Escape-Room-WebApp
- **Abweichungen vom Plan:** Zusätzlich eingebaut wurden der Drehhinweis für Handys im Hochformat (mit der Nutzerin abgestimmt) und die schmalere Kopfleiste auf niedrigen Bildschirmen (Ergebnis der Sichtprüfung). Objekte haben vorerst nur ein Feld `text` statt `aktion`. Die Aktionen (`oeffneSzene`, `findeSpur`, `schloss`) kommen in den Schritten 4 bis 6 hinzu, sobald sie gebraucht werden.
- **Git-Commit:** `5caa4de`

### 2026-10-04, 02:37 – Schritt 4: Detailansichten mit Zoom
- **Auslöser:** Anweisung des Nutzers: „Ja bitte Schritt 4 jetzt“ (Schritt 4 des freigegebenen Plans).
- **Durchgeführte Schritte:**
  - Raumdaten erweitert: Gemälde, Pinnwand und Schreibtisch haben jetzt die Aktion `{ typ: "oeffneSzene", ziel: … }`. Dazu kommen drei Detailszenen mit eigenen Objekten: Schreibtisch mit Papierstapel, Kalender und Füllfederhalter; Pinnwand mit Foto, Notiz und blauem Zettel; Gemälde mit Hafenstadt und Rahmenecke. Ihre Texte enthalten bereits die Hinweise aus dem Rätsel-Entwurf (rote 4, grüne 1, blaue 7, „Rot – Grün – Blau“).
  - Jede Szene hat ein Feld `platzhalter`. Es wählt einen passenden CSS-Platzhalter-Hintergrund (Zimmer, Holz, Kork, Wand), solange kein Bild vorhanden ist.
  - In `index.html` eine innere Ebene `.szene` eingeführt (Hintergrund und Objekte), die beim Zoomen als Ganzes bewegt wird. Der Zurück-Knopf liegt außerhalb und bleibt stehen.
  - In `anzeige.js` die Funktionen `zoomeHinein`/`zoomeHeraus` ergänzt (Web Animations API). Die Szene vergrößert sich mit Ursprung in der Objektmitte und blendet aus, dann wird die neue Szene gezeichnet und eingeblendet. Während der Animation sind keine Klicks möglich (`inert`). Bei der Systemeinstellung „Bewegung reduzieren“ entfällt die Animation.
  - In `main.js` die aktuelle Szene und einen Verlauf (vorige Szene und Zoompunkt) als lokalen Zustand angelegt.
  - Sichtprüfung per Screenshot: alle drei Detailansichten, ein Zwischenbild der Zoom-Animation, Zustand nach „Zurück“, Textfenster in der Detailansicht, Handy quer.
  - Abschnitt 2 aktualisiert.
- **Geänderte/neue Dateien:** `shared/raeume/arbeitszimmer.js`, `public/js/anzeige.js`, `public/js/main.js`, `public/index.html`, `public/css/style.css`, `DOKUMENTATION.md`
- **Genutzte Tools:** Claude Code, Node.js, Google Chrome (headless, DevTools-Protokoll), Git
- **Probleme & Lösungen:**
  - Eine Animation, die ihren Endzustand hält (`fill: forwards`), hätte nach dem Szenenwechsel die neue Szene unsichtbar gelassen. Lösung: Die alte Animation wird erst abgebrochen, nachdem die neue gestartet ist; nur das Ausblenden hält seinen Endzustand.
  - Zwei Testaufnahmen schlugen wegen eines Fehlers im Testskript fehl (`await` außerhalb einer async-Funktion), nicht wegen der App → Skript korrigiert und wiederholt.
- **Ergebnis:** Klickt man Schreibtisch, Pinnwand oder Gemälde an, zoomt das Spiel in eine Detailansicht; „Zurück“ zoomt wieder heraus. In keiner Ansicht gab es JS-Fehler.
- **Bezug zur Planung:** 2026-10-04, 02:07 – Planung: Erste Version der Escape-Room-WebApp
- **Abweichungen vom Plan:** Zusätzlich gibt es pro Szene das Feld `platzhalter` für eigene Platzhalter-Hintergründe, damit die Detailansichten schon ohne Grafiken unterscheidbar sind. Hinzu kommt die Rücksicht auf „Bewegung reduzieren“. Die Hinweise stehen vorerst als normale Texte in den Objekten; das Sammeln im Notizbuch folgt wie geplant in Schritt 5.
- **Git-Commit:** `4ed7327`

### 2026-10-04, 02:45 – Schritt 5: Spiellogik, Spuren und Notizbuch
- **Auslöser:** Anweisung des Nutzers: „Schritt 5 gerne“ (Schritt 5 des freigegebenen Plans).
- **Durchgeführte Schritte:**
  - Raumdaten: Fünf Objekte in den Detailansichten haben jetzt die Aktion `{ typ: "findeSpur", spur: … }`: Papierstapel, Kalender, Notiz, blauer Zettel und Rahmenecke. Dazu kommt eine Liste `spuren` mit Titel und Notizbuch-Text je Spur.
  - `shared/spiel-logik.js` angelegt mit `erstelleSpielstand()`, `verarbeiteAktion()` und `findeObjekt()`. Die Aktion `untersuche` trägt die Spur eines Objekts ein, jede höchstens einmal. Der Spielstand wird nie verändert, sondern neu erzeugt. Ändert sich nichts, kommt derselbe Spielstand zurück.
  - `public/js/verbindung-lokal.js` angelegt mit `sendeAktion()` und `beiAenderung()`. Das ist die Schnittstelle, die später eine Online-Verbindung mit denselben Funktionen ersetzen kann.
  - `main.js` schickt beim Klick auf ein Objekt nur noch die Aktion `untersuche`. Ob das Objekt eine Spur liefert, entscheidet die Logik. Das verhindert später im Mehrspieler-Modus, dass ein Browser Spuren „erfindet“.
  - `anzeige.js`: Notizbuch (Dialog mit Liste der gefundenen Spuren in Fundreihenfolge), Zähler am Notizbuch-Knopf, Häkchen an Objekten mit gefundener Spur, Meldung „Neue Spur im Notizbuch notiert“ im Textfenster und kurzes Aufleuchten des Notizbuch-Knopfs.
  - `test/spiel-logik.test.js` mit 8 Tests angelegt, Skript `npm test` in `package.json`. Alle 8 Tests bestehen.
  - Sichtprüfung per Screenshot: leeres Notizbuch, Fund mit Meldung, Häkchen nach zwei Funden, Notizbuch mit drei Spuren, Handy quer.
  - Abschnitt 2 aktualisiert.
- **Geänderte/neue Dateien:** `shared/spiel-logik.js`, `shared/raeume/arbeitszimmer.js`, `public/js/verbindung-lokal.js`, `public/js/anzeige.js`, `public/js/main.js`, `public/index.html`, `public/css/style.css`, `test/spiel-logik.test.js`, `package.json`, `DOKUMENTATION.md`
- **Genutzte Tools:** Claude Code, Node.js (`node:test`), Google Chrome (headless, DevTools-Protokoll), Git
- **Probleme & Lösungen:**
  - Python ließ sich für eine Dateiänderung nicht nutzen (Xcode-Lizenz unter macOS nicht bestätigt) → Änderungen direkt mit dem Editor-Werkzeug vorgenommen.
  - Die Schrift Georgia zeigt Ziffern im Mediävalstil, die „0“ im Zähler sah wie ein „o“ aus. `font-variant-numeric: lining-nums` wirkte bei Georgia nicht → Zähler in der Systemschrift. Das ist auch für die spätere Timer-Anzeige zu beachten.
- **Ergebnis:** Gefundene Spuren landen im Notizbuch, der Zähler zählt mit, und bereits gefundene Objekte sind markiert. Die Spiellogik ist von der Anzeige getrennt und getestet. In keiner Ansicht gab es JS-Fehler.
- **Bezug zur Planung:** 2026-10-04, 02:07 – Planung: Erste Version der Escape-Room-WebApp
- **Abweichungen vom Plan:**
  - Zusätzlich gibt es den Papierstapel mit der Spur „Folgt den Farben“ als Hinweis, dass die Farben wichtig sind.
  - Die Aktion `findeSpur` steht in den Raumdaten. Die Anzeige schickt aber immer `untersuche`, und die Logik wertet `findeSpur` aus (wie im Plan unter Architektur beschrieben).
  - Die Funktion `restzeit()` kommt erst mit dem Timer in Schritt 7.
- **Git-Commit:** `7fc35c6`
