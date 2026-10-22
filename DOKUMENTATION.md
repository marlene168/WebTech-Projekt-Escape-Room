# Projektdokumentation: Escape-Room

> Diese Datei wird während der Entwicklung fortlaufend von Claude Code bzw. Codex gepflegt (Regeln siehe `CLAUDE.md` bzw. `AGENTS.md`).
> Einträge im Entwicklungsprotokoll werden nur angehängt und nachträglich nicht verändert.
> Jeder Eintrag verweist auf den zugehörigen Git-Commit im GitHub-Repository.

## 1. Projektüberblick
- **Ziel der App:** Entwicklung einer browserbasierten WebApp, die das Erlebnis eines Escape Rooms digital simuliert. Spielende wählen einen Raum aus und versuchen, durch das Untersuchen anklickbarer Objekte und das Kombinieren von Hinweisen ein Rätsel unter Zeitdruck zu lösen. Als Erweiterung sind mehrere Räume mit unterschiedlichen Themen und Schwierigkeitsgraden vorgesehen.
- **Rahmen:** Seminar-/Projektarbeit, Web Technologie 
- **Zeitraum:** Start 03.10.2026 – laufend
- **Tech-Stack:** HTML, CSS, JavaScript (ES-Module, ohne Framework); supabase-js im Browser (per CDN, feste Version); Supabase als Backend (Gastanmeldung, PostgreSQL mit RLS, Edge Functions in Deno, Realtime), bisher lokal in Docker; Node.js mit Express nur als lokaler Entwicklungsserver; Tests mit `node:test`; CI mit GitHub Actions. Geplant, noch nicht umgesetzt: Supabase-Cloud-Projekt und Vercel für die Bereitstellung der Website (siehe Abschnitt 3 und `docs/ideen.md`)
- **Werkzeuge:** VS Code, Claude Code, Codex (im Wechsel mit Claude Code), ChatGPT (Planungsgespräche der Nutzerin), Git, GitHub, GitHub Actions (CI), GitHub CLI (`gh`), Node.js/npm, Docker Desktop, Supabase CLI (als npm-Abhängigkeit), Google Chrome (Headless-Screenshots zur Sichtprüfung)
- **Repository:** https://github.com/marlene168/WebTech-Projekt-Escape-Room

## 2. Aktueller Stand
_Stand: AP 4 abgeschlossen. **Online-Mehrspieler mit Sitzungen funktioniert lokal** (Meilenstein 1 lokal erreicht). Ein Raum, alle Grafiken, Videos und Töne noch als Platzhalter. Noch nicht in der Cloud veröffentlicht._

**Umgesetzt:**

- **Funktionen:**
  - **Startseite** mit Raumkarten: Titel, Schwierigkeit als Sterne, Dauer, Kurzbeschreibung, bei Räumen mit Schreckmoment ein Hinweis. „Spielen“ erstellt eine neue Sitzung (Gastanmeldung im Hintergrund). Über ein Feld oben tritt man mit dem Code einer anderen Person bei. Räume sind frei wählbar und nach Schwierigkeit sortiert.
  - **Sitzungen** (seit AP 3/4):
    - Jede Sitzung hat einen Code aus 6 Zeichen. Bis zu vier Personen spielen gemeinsam, beitreten geht nur vor dem Start.
    - Die Spielseite zeigt Code und Anzahl der Mitspielenden. Nur die erstellende Person sieht „Raum betreten“, die anderen sehen einen Wartehinweis.
    - Fortschritt und Timer sind geteilt, die angesehene Szene bleibt pro Gerät.
    - Nach dem Neuladen geht es mit demselben Stand und derselben Restzeit weiter.
    - Verlässt die erstellende Person die Sitzung bewusst, ist sie für alle beendet, und die anderen sehen „Sitzung beendet“.
    - „Nochmal spielen“ erstellt eine neue Sitzung. Fremde haben keinen Zugriff auf eine Sitzung.
  - **Vorgeschichte:** Vor dem Raum erscheint ein Intro, der Timer startet erst mit „Raum betreten“. Nach dem Sieg folgt ein Outro (Nachricht des Professors), bei Zeitablauf die Hausmeister-Szene mit Spannungsaufbau und Schreckmoment (Licht und Ton). Optionale Videos sind vorbereitet, der Text dient als Untertitel bzw. Ersatz.
  - **Spielraum:** 16:9-Bühne, die sich an jede Fenstergröße anpasst. Im Arbeitszimmer stehen fünf klickbare Objekte, zunächst als Platzhalter mit Emoji und Namen. Schreibtisch, Pinnwand und Gemälde öffnen per Zoom eine Detailansicht, „Zurück“ zoomt heraus.
  - **Rätsel:** Fünf Objekte liefern Spuren fürs Notizbuch (mit Häkchen an bereits gefundenen). Die Tür hat ein Zahlenschloss mit drei Ziffernrädern. Ob ein Code stimmt, entscheidet das Backend.
  - **Timer:** 10 Minuten nach der Uhr des Servers, in der letzten Minute rot. Der Hilfe-Knopf gibt drei gestufte Tipps für je 1 Minute Strafe. Alle Mitglieder dürfen Tipps holen, und gleichzeitige Anfragen zählen nur einmal.
  - **Spielende:** Die Ende-Bildschirme (gewonnen, Zeit abgelaufen, Sitzung beendet) zeigen eine Statistik und bieten „Nochmal spielen“ und „Zur Raumauswahl“.
  - **Handy:** Im Hochformat erscheint der Hinweis, das Gerät quer zu halten.
- **Backend (Supabase, lokal in Docker):**
  - Edge Functions `sitzung-erstellen`, `sitzung-beitreten`, `sitzung-laden` und `aktion`. Sie entscheiden über den Spielstand, mit der geteilten Spiellogik, den geheimen Raumdaten und der Serverzeit.
  - Atomare Datenbankfunktionen sichern gleichzeitige und doppelt gesendete Aktionen sowie gleichzeitige Beitritte ab.
  - RLS: Mitglieder dürfen nur lesen. Realtime meldet bestätigte Änderungen nur an Mitglieder.
  - Lösungen und Tipp-Texte liegen nur im Backend.
- **Starten:**
  - Node.js 24 (siehe `.nvmrc`), `npm install` (einmalig).
  - `npm run backend:start` (Docker Desktop muss laufen), dann `npm start` und http://localhost:3000 öffnen.
  - Tests: `npm test` (64 Unit-Tests) und `npm run test:backend` (24 Backend-Tests).
  - Siehe `docs/anleitung.md`.
- **CI:** GitHub Actions führt bei jedem Push und Pull Request `npm ci` und `npm test` aus, dazu im Job `backend` die Backend-Tests gegen ein frisches, temporäres Supabase (`.github/workflows/ci.yml`). Der Workflow veröffentlicht nichts und hat keinen Zugang zum Cloud-Projekt.
- **Ordnerstruktur:**
  - `server.js` – lokaler Entwicklungsserver, liefert nur `public/` aus
  - `public/index.html` (Startseite) und `public/spiel.html` (Spielseite), `public/css/style.css`
  - `public/js/`:
    - `start.js`: Raumkarten, Sitzung erstellen, Beitritt per Code
    - `main.js`: Einstieg der Spielseite
    - `anzeige.js`: Szenen, Objekte, Fenster, Timer, Notizbuch, Hilfe, Sitzungsinfos
    - `geschichte.js`: Geschichtstexte, Videos, Spannung, Schreckmoment, Ton
    - `verbindung-online.js`: Gastanmeldung, Sitzungen, Aktionen, Realtime, Abgleich
    - `supabase-konfig.js`: Adresse und öffentlicher Schlüssel, lokal oder Cloud
  - `public/shared/` – nur Öffentliches, wird auch von den Edge Functions genutzt:
    - `spiel-logik.js`: Spielregeln als reine Funktionen
    - `raeume/`: öffentliche Raumdaten mit `version`; `index.js` listet alle Räume
    - `raetsel/`: Rätseltyp-Register (bisher `zahlenschloss`)
  - `public/bilder/`, `public/videos/`, `public/toene/` – je Raum ein Unterordner (noch leer, siehe Anleitung)
  - `supabase/` – Backend:
    - `config.toml`: u. a. Gastanmeldung
    - `migrations/`: Tabellen, Zugriffsregeln, Datenbankfunktionen
    - `functions/`: die vier Edge Functions
    - `functions/_shared/`: Kern `kern.js`, Hilfsfunktionen, geheime Raumdaten in `raeume/`
  - `test/` – Unit-Tests (`npm test`); `test-backend/` – Backend-Tests gegen das lokale Supabase (`npm run test:backend`)
  - `.github/workflows/ci.yml` – CI (Unit- und Backend-Tests)
  - `docs/`:
    - `plaene/`: freigegebene Pläne
    - `anleitung.md`: Starten, Backend lokal, Grafiken, Videos und Ton, neuer Raum, Liste der benötigten Dateien
    - `ideen.md`: Ideensammlung inklusive verworfener Ideen
- **Wichtigste Dateien:** `public/js/verbindung-online.js`, `public/js/main.js`, `public/shared/spiel-logik.js`, `public/shared/raeume/arbeitszimmer.js`, `supabase/functions/_shared/kern.js`, `supabase/functions/aktion/index.js`, `supabase/migrations/20261022141522_sitzungen.sql`, `docs/anleitung.md`
- **Grafiken, Videos, Ton austauschen und neue Räume anlegen:** siehe [`docs/anleitung.md`](docs/anleitung.md)
- **Bekannte Grenzen (Stand AP 4):**
  - Nur lokal spielbar, Cloud und Vercel folgen in AP 5.
  - Andere Mitglieder als die erstellende Person verlassen eine Sitzung nur durch Schließen der Seite. Sie bleiben Mitglied und können wieder einsteigen.
  - Beendete Sitzungen werden noch nicht aufgeräumt.
  - Nach Änderungen an Dateien in `public/shared/` muss das lokale Backend neu gestartet werden (siehe Anleitung).

**Geplant (noch nicht umgesetzt):**

- **AP 5 – Cloud und Vercel:** Supabase-Cloud-Projekt, Bereitstellung über Vercel mit bewusst ausgelöstem Deployment (der Workflow wird vorher konkretisiert), Meilenstein 1 auf echten Geräten.
- **AP 6 und 7 – Raum 2 und Raum 3:** jeweils mit eigener Planung.
- **Später:** eine Rangliste mit Anzeigenamen und Bestzeiten und die abgestimmte endgültige Gestaltung.
- **Plan für diese Phase** (freigegeben am 2026-10-22): [`docs/plaene/2026-10-22_mehrspieler-grundlage.md`](docs/plaene/2026-10-22_mehrspieler-grundlage.md).
- **Offen:**
  - Aufräumen beendeter Sitzungen
  - Anzeigenamen
  - E-Mail-Konten
  - manuell ausgelöster Deployment-Workflow
  - Inhalte von Raum 2 und 3

  Details stehen in [`docs/ideen.md`](docs/ideen.md).

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
| 2026-10-04 | Räume sind inhaltlich eigenständig und haben einen festen Schwierigkeitsgrad (1–3); spätere Räume sind schwerer | Räume einzeln und in beliebiger Reihenfolge spielbar; je Raum andere Themes, Geschichten und Rätsel möglich (Begründung der Nutzerin, siehe `docs/ideen.md`) | Raumübergreifende Geschichte mit Gesamträtsel am Ende |
| 2026-10-04 | Räume frei wählbar, auf der Startseite nach Schwierigkeit sortiert; Freischalten nacheinander vorerst nicht vorgesehen | Folgt aus „in beliebiger Reihenfolge spielen“; bei Bedarf später zu klären | Nacheinander freischalten mit gespeichertem Fortschritt |
| 2026-10-04 | Zwei Seiten: Startseite `index.html` und Spielseite `spiel.html?raum=<id>` | Für Einsteiger leicht nachvollziehbar, kein Seitenwechsel per JavaScript nötig | Eine einzige Seite mit Umschalten per JavaScript |
| 2026-10-04 | Neuer Spielstatus „bereit“ vor „läuft“; der Timer startet erst mit „Raum betreten“ | Intro kann in Ruhe gelesen werden; im Mehrspieler-Modus kann die Gruppe später gemeinsam starten (Lobby) | Timer startet beim Laden der Seite; Spielstand erst nach dem Intro erzeugen |
| 2026-10-04 | Jeder Raum hat eine eigene Geschichte (Intro, Outro, Verloren-Text) in seinen Raumdaten, jeweils optional mit Video; der Text bleibt als Untertitel bzw. Ersatz; Tests prüfen, dass jeder Raum alle drei Texte hat | Räume bleiben eigenständig; das Spiel funktioniert auch ohne Videos oder wenn ein Video nicht lädt | Texte fest in der Anzeige; Videos ohne Text-Ersatz |
| 2026-10-04 | Schreckmoment bei Zeitablauf pro Raum ausdrücklich an (`schreck: {…}`) oder aus (`schreck: null`); Hinweis auf der Raumkarte wird daraus abgeleitet; eingebauter Ersatzton, solange keine Sounddatei da ist; einmalige Lichteinblendung ohne Blinken, begrenzte Lautstärke | Kein Raum bekommt versehentlich einen Schreck; Spielende werden vorgewarnt; funktioniert sofort ohne Dateien; Rücksicht auf anfallsgefährdete und schreckhafte Personen | Schreck immer automatisch mit Ersatzton; Hinweis von Hand pflegen |
| 2026-10-20 | Entwicklung im Wechsel mit Claude Code und Codex; `AGENTS.md` enthält für Codex dieselben Regeln wie `CLAUDE.md` | Arbeit kann weitergehen, wenn das Tageskontingent eines Werkzeugs aufgebraucht ist; gleiche Regeln halten Commits und Dokumentation einheitlich | Nur Claude Code (Pausen bei aufgebrauchtem Kontingent); Codex ohne eigene Regeldatei |
| 2026-10-22 | Mehrspieler-Modus ist die wichtigste technische Anforderung und wird früh umgesetzt. Mehrere Personen lösen einen Raum gemeinsam, andere Personen oder Gruppen spielen dieselbe Raumvorlage unabhängig | Ergebnis der Planung der Nutzerin mit ChatGPT; gemeinsames Spielen ist der Kern der geplanten App | Mehrspieler erst als späte Erweiterung |
| 2026-10-22 | Vercel für die Bereitstellung der Website; Supabase für Authentifizierung, Datenbank, Backend-Funktionen und Echtzeit-Kommunikation | Ergebnis der Planung der Nutzerin mit ChatGPT; Anmeldung, Datenbank und Echtzeit sind fertig verfügbar und müssen nicht selbst gebaut werden; Spielstände bleiben gespeichert (Abwägung siehe `docs/ideen.md`). Ersetzt die Planung mit Socket.IO aus dem Eintrag vom 2026-10-04 | Eigener Express-Server mit Socket.IO bei Render (Variante A, derzeit nicht gewählt); Mischung aus beiden Varianten |
| 2026-10-22 | Das Frontend bleibt bei HTML, CSS und JavaScript ohne Framework | Bestehender Code bleibt nutzbar; bestätigt die Entscheidung vom 2026-10-04 | Wechsel zu React oder Next.js (derzeit nicht vorgesehen) |
| 2026-10-22 | Architekturziel für den Mehrspieler-Modus: Raumvorlagen sind von Spielsitzungen getrennt (je Sitzung eine ID, ein Beitrittscode, Mitglieder und ein eigener verbindlicher Spielstand). Fortschritt und Timer sind in der Sitzung geteilt, die Szene bleibt pro Gerät. Der Browser zeigt an und sendet Aktionsversuche. Das Backend prüft Identität, Mitgliedschaft, Berechtigungen, Eingaben, Status und Zeit und entscheidet über den neuen Spielstand. Realtime verteilt nur bestätigte Änderungen. Startzeit und Zeitbewertung werden zentral bestimmt. Geheime Lösungen und nicht freigegebene Hinweise gehen nicht mehr an den Browser. Gleichzeitige Aktionen überschreiben nichts, doppelt gesendete wirken nur einmal (z. B. keine doppelte Tippstrafe). Der Sitzungsstand wird nach Neuladen oder Verbindungsabbruch wiederhergestellt. Daten und Realtime sind auf berechtigte Mitglieder begrenzt. Bestehende Spiellogik wird soweit sinnvoll weiterverwendet; die lokale Verbindung bekommt eine Online-Verbindung zur Seite. Bevorzugt werden Supabase Edge Functions | Ergebnis der Planung der Nutzerin mit ChatGPT; ein Spiel mit mehreren Personen ist nur fair und sicher, wenn eine zentrale Stelle entscheidet; im jetzigen Prototyp sind Lösungen öffentlich abrufbar und der Spielstand ist manipulierbar (siehe Abschnitt 2). Offen: Aufteilung zwischen Edge Functions und Datenbank, Umgang mit gleichzeitigen Aktionen, Rolle von `server.js` | Spiellogik im Browser, Realtime synchronisiert nur den Stand (manipulierbar, Lösungen sichtbar) |
| 2026-10-22 | Erster Mehrspieler-Meilenstein: Zwei Personen spielen das Arbeitszimmer gemeinsam, eine dritte gleichzeitig in einer unabhängigen Sitzung. Nachzuweisen sind gemeinsamer Fortschritt in der Gruppe, getrennter Fortschritt zwischen Sitzungen, korrekt verarbeitete gleichzeitige Aktionen, geschützte Zugriffe und Wiederaufnahme nach Neuladen | Ergebnis der Planung der Nutzerin mit ChatGPT; prüft die Kernanforderungen der Architektur an einem kleinen, vorhandenen Raum | – |
| 2026-10-22 | Automatische CI-Prüfungen sind gewünscht. Deployments, auch Vorschau-Deployments, werden bewusst ausgelöst bzw. freigegeben | Ergebnis der Planung der Nutzerin mit ChatGPT; Fehler früh erkennen, ohne dass jeder Push eine Veröffentlichung erzeugt | Automatisches Deployment nach jedem Push |
| 2026-10-22 | Rangliste mit Anzeigenamen und Bestzeiten als spätere Erweiterung; sie misst Wiederholung und Geschwindigkeit, deshalb ist eine bekannte Lösung kein Ausschlussgrund | Ergebnis der Planung der Nutzerin mit ChatGPT. Offen: Einzel- und Teamergebnisse, Bewertungsregeln | Ausschluss von Personen, die die Lösung schon kennen |
| 2026-10-22 | Die endgültige Gestaltung wird abgestimmt, bevor die Grafiken in größerem Umfang umgesetzt werden | Ergebnis der Planung der Nutzerin mit ChatGPT; Design und Atmosphäre sind wichtig, die Gestaltung ist aber noch offen | Grafiken sofort vollständig umsetzen |
| 2026-10-22 | Gastzugang (anonyme Anmeldung bei Supabase) für den ersten Mehrspieler-Meilenstein; E-Mail-Konten später | Jede Person hat ohne Registrierung eine echte Nutzer-ID, die Zugriffsregeln funktionieren von Anfang an; ein Gastzugang lässt sich später mit einem Konto verknüpfen (Entscheidung der Nutzerin auf Empfehlung von Claude) | E-Mail-Konto ab Meilenstein 1 (mehr Aufwand, drei E-Mail-Adressen zum Testen nötig) |
| 2026-10-22 | Gespielt wird nur online; ein Einzelspiel ist eine Sitzung mit einer Person; ein lokales Backend während der Entwicklung bleibt erlaubt | Nur ein Weg durchs Spiel; nur so bleiben Lösungen und Tipps aus dem Browser (Entscheidung der Nutzerin auf Empfehlung von Claude) | Offline-Modus mit lokaler Verbindung behalten |
| 2026-10-22 | Spielregeln für Sitzungen: Beitritt neuer Mitglieder nur per Beitrittscode; Laden per Sitzungs-ID nur für Mitglieder; nur die erstellende Person startet; höchstens vier Personen; alle Mitglieder dürfen Tipps anfordern; erneutes Spielen erzeugt eine neue Sitzung | Von der Nutzerin festgelegt | Neustart innerhalb einer Sitzung über eine „Runde“; alle Mitglieder dürfen starten |
| 2026-10-22 | Datenmodell: Spielstand als ein `jsonb`-Dokument pro Sitzung mit Versionsnummer; Raumvorlagen bleiben im Code, die Sitzung speichert `raum_id` und `raum_version`; eine Aktionen-Tabelle dient nur gegen Doppelverarbeitung und zur Nachvollziehbarkeit | Vorschlag von Claude nach Abgleich mit dem Code: Der Spielstand ist schon ein kleines JSON-Objekt, drei Räume mit verschiedenen Rätseln brauchen so kein eigenes Backend; Raumversion verhindert Rechnen mit veralteten Lösungen (Raumversion auf Wunsch der Nutzerin) | Fortschritt in vielen normalisierten Tabellen; Raumvorlagen in der Datenbank; Event-Sourcing |
| 2026-10-22 | Jeder Raum besteht aus einer öffentlichen und einer geheimen Datei (Lösungen, Tipp-Texte); öffentlich später unter `public/shared/`, geheim unter `supabase/functions/_shared/`; Vercel liefert nur `public/` aus | Geheimnisse erreichen den Browser nicht; die vorhandene reine Spiellogik wird im Backend mit dem zusammengesetzten Raum weiterverwendet | Geheimnisse weiter im Browser; Raumdaten nur im Backend (Browser bräuchte für jede Anzeige eine Anfrage) |
| 2026-10-22 | Aufgabenverteilung: Edge Functions `sitzung-erstellen`, `sitzung-beitreten`, `sitzung-laden`, `aktion` prüfen Anmeldung, Mitgliedschaft, Rechte, Eingaben, Raumversion und Zeit; Datenbankfunktionen speichern atomar mit Versionsprüfung (Aktionseintrag und Spielstand gelingen gemeinsam oder gar nicht), Beitritte mit Zeilensperre; schreibende Datenbankfunktionen nur für das Backend (`service_role`), getestet; RLS erlaubt Mitgliedern nur Lesen; Realtime („Postgres Changes“) verteilt nur bestätigte Änderungen; Tipps tragen die gesehene Tipp-Nummer; Zeitablauf erkennt der Server beim Laden, Beitritt und bei Aktionen; beim Wiederverbinden erst abonnieren, dann abgleichen | Das Backend ist alleiniger Schiedsrichter; gleichzeitige und doppelte Aktionen bleiben korrekt; keine verpassten Änderungen (Vorschlag von Claude, ergänzt um Anforderungen der Nutzerin zu Atomarität, Beitritten, Zeitablauf, Rechten der Datenbankfunktionen und Abgleich) | Spiellogik im Browser; Realtime-Broadcast statt Postgres Changes (erst bei großer Last nötig); Ablaufmeldung durch den Browser |
| 2026-10-22 | Rätseltyp-Register: jeder Rätseltyp als kleines Logik- und Anzeige-Modul, Raumdaten nennen den Typ, allgemeine Aktion `loese` statt `probiereCode` | Neue Räume mit neuen Rätseltypen brauchen keine Änderungen an Edge Functions, Tabellen oder Regeln | Sonderlogik pro Raum im Backend; Rätseltypen schon auf Vorrat bauen |
| 2026-10-22 | Supabase lokal (CLI als npm-Entwicklungsabhängigkeit mit fester Version, Docker-kompatible Laufzeit) für Entwicklung und CI; das Cloud-Projekt nur für Gerätetests und den späteren Betrieb | Auf Wunsch der Nutzerin: Die CI baut eine frische, temporäre Umgebung und verändert nie das gemeinsam genutzte Cloud-Projekt; lokal und in der CI dieselbe CLI-Version | Nur mit dem Cloud-Projekt arbeiten; CI gegen das Cloud-Projekt |
| 2026-10-22 | CI mit GitHub Actions, eingerichtet von Claude: Node-Version aus `.nvmrc`, `npm ci`, `npm test`; ab dem Backend zusätzlich `npm run test:backend` gegen ein frisches lokales Supabase; lokal und in der CI dieselben Befehle; Tests entstehen mit den Funktionen; kein automatisches Deployment, ein manuell ausgelöster Deployment-Workflow wird vor AP 5 konkretisiert | Auf Wunsch der Nutzerin: Fehler früh erkennen, ohne dass etwas veröffentlicht wird; ein Test-Werkzeug (`node:test` mit supabase-js) | pgTAP als zweites Test-Werkzeug; automatische Deployments nach jedem Push |
| 2026-10-22 | Arbeitspakete nacheinander auf eigenen Branches (Code, Tests und Doku auf demselben Branch); Pull Request nach erfolgreichen Prüfungen; Zusammenführen nach Freigabe der Nutzerin mit Merge-Commit; Planungsdoku direkt auf `main` | Auf Wunsch der Nutzerin; der Merge-Commit erhält die Commit-Kennungen, auf die `DOKUMENTATION.md` verweist (Vorschlag von Claude) | Arbeit direkt auf `main`; Squash- oder Rebase-Merge (Commit-Kennungen in der Doku wären auf `main` nicht mehr auffindbar); eigene Branches für kleine Änderungen |
| 2026-10-22 | Neue Mitglieder treten nur bei, solange die Sitzung den Status „bereit“ hat (vor dem Spielstart). Bereits vorhandene Mitglieder steigen nach Neuladen oder Verbindungsabbruch jederzeit wieder ein, der Timer läuft dabei weiter. Beitritt und Spielstart werden in der Datenbank gegeneinander abgesichert und getestet | Von der Nutzerin festgelegt | Beitritt bis zum Spielende erlauben (Vorschlag von Claude) |
| 2026-10-22 | Edge Functions in JavaScript mit `@supabase/server` (`withSupabase({ auth: "user" })`): Anmeldung, CORS und Backend-Zugang kommen aus dem Paket; Spielregeln liegen in einem reinen Kern (`supabase/functions/_shared/kern.js`), der die geteilte Spiellogik direkt aus `shared/` importiert; feste Versionen (CLI 2.120.0, supabase-js 2.117.3, `@supabase/server` 1.9.1) | Vorschlag von Claude bei der Umsetzung: Die aktuelle Supabase-Vorlage nutzt dieses Paket; JavaScript passt zum übrigen Projekt; der Kern ist ohne Datenbank mit `node:test` prüfbar; der Import von außerhalb `supabase/` funktioniert lokal und in der CI | TypeScript-Vorlage; eigene Prüfung der Anmelde-Token; Kopie der Spiellogik ins Backend |
| 2026-10-22 | Gleichzeitige Aktionen: bis zu 8 Versuche mit kurzer Zufallspause bei Versionskonflikten; `speichere_aktion` meldet einen Versionskonflikt als Ergebnis (es wurde dann noch nichts geschrieben) statt als Fehler | Bei vier gleichzeitigen Aktionen ging mit 3 Versuchen eine verloren (CI-Befund); als Ergebnis ist der Konflikt für die Edge Function einfacher zu behandeln | 3 Versuche (Plan); Konflikt als Datenbankfehler |
| 2026-10-22 | Realtime gilt erst als bereit, wenn nach `SUBSCRIBED` auch die Systemnachricht „Subscribed to PostgreSQL“ eingetroffen ist; erst danach wird abgeglichen (gilt für das Wiederverbinden im Browser ab AP 4) | Befund aus den Tests: Änderungen kurz nach `SUBSCRIBED` kamen nicht an. Wer zu früh abgleicht, kann Änderungen verpassen | Nach `SUBSCRIBED` sofort abgleichen; feste Wartezeit |
| 2026-10-22 | Verlässt die erstellende Person die Sitzung bewusst (vor dem Start oder während des Spiels), wird die Sitzung für alle beendet. Die übrigen Mitglieder erhalten eine Meldung, die Startberechtigung wird nicht übergeben. Neuladen oder ein kurzer Verbindungsabbruch gelten nicht als Verlassen; bewusstes Verlassen ist nur der ausdrückliche Klick auf „Verlassen“ | Von der Nutzerin festgelegt, möglichst einfache Umsetzung | Übergabe der Startberechtigung an ein anderes Mitglied; Sitzung läuft ohne die erstellende Person weiter; Verbindungsabbruch als Verlassen werten |
| 2026-10-22 | `server.js` bleibt als lokaler Entwicklungsserver, der nur `public/` ausliefert; Spielregeln, Sitzungen und Geheimnisse liegen ausschließlich im Supabase-Backend | Beantwortet die offene Frage nach der Rolle von `server.js`; lokal genügt ein einfacher Dateiserver, Vercel liefert später `public/` direkt aus | `server.js` entfernen (lokales Ausprobieren würde umständlicher); Spiellogik weiter im Express-Server |
| 2026-10-22 | Im Browser: supabase-js per CDN mit fester Version (kein Build-Werkzeug); die gespeicherte Gastanmeldung wird einmal pro Seitenaufruf beim Server geprüft und bei Bedarf erneuert; Aktionen tragen eine eigene `aktionId` und werden bei Netzfehlern mit derselben ID wiederholt | Passt zum Frontend ohne Framework; eine Anmeldung zu einem gelöschten Gast (gefunden nach einem lokalen Datenbank-Reset) führte sonst zu Fehlern; Wiederholungen bleiben dank `aktionId` unschädlich | npm-Paket mit Build-Schritt; gespeicherte Anmeldung ungeprüft übernehmen; Aktionen bei Netzfehlern nicht wiederholen |
| 2026-10-22 | Bedienung der Sitzungen: „Spielen“ erstellt sofort eine Sitzung (auch zum Alleinspielen), Beitritt über ein Code-Feld auf der Startseite, ohne Mitgliedschaft geht es mit Hinweis zurück zur Startseite; „Nochmal spielen“ erstellt eine neue Sitzung (Mitspielende treten mit dem neuen Code bei); nur das Verlassen der erstellenden Person ist eine Backend-Aktion (mit Nachfrage), andere Mitglieder schließen einfach die Seite | Möglichst einfache Umsetzung der Entscheidungen; ein Weg für Einzel- und Mehrspieler | Getrennte Knöpfe „Allein spielen“ und „Gruppe erstellen“; Mitspielende automatisch in die neue Sitzung übernehmen; Austreten als eigene Backend-Aktion |

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

### 2026-10-04, 02:53 – Schritt 6: Zahlenschloss
- **Auslöser:** Anweisung des Nutzers: „Schritt 6 gerne“ (Schritt 6 des freigegebenen Plans).
- **Durchgeführte Schritte:**
  - Raumdaten: Die Tür hat jetzt die Aktion `{ typ: "schloss", schloss: "tuer" }`. Neu sind die Liste `schloesser` (Name, Text, Code „417“) und das Feld `ausgang`, das festlegt, welches Schloss den Raum löst.
  - Spiellogik: Der Spielstand hat neu `status` („laeuft“/„gewonnen“), `geoeffneteSchloesser` und `fehlversuche`. Die neue Aktion `probiereCode` zählt bei falschem Code einen Fehlversuch. Bei richtigem Code wird das Schloss geöffnet; ist es der Ausgang, ist das Spiel gewonnen. Nach dem Spielende ändern Aktionen nichts mehr.
  - 6 neue Tests (insgesamt 14, alle bestanden).
  - Anzeige: Schloss-Fenster mit Messing-Rädchen (▲/▼, Anzahl passend zur Code-Länge), Knopf „Öffnen“, Meldung „Das Schloss rührt sich nicht.“ und Wackel-Animation bei einem Fehlversuch. Dazu ein Gewinn-Bildschirm, der sich nicht mit Esc schließen lässt; „Nochmal spielen“ lädt die Seite neu.
  - Sichtprüfung per Screenshot: Schloss-Fenster, falscher Code, richtiger Code mit Gewinn-Bildschirm, Klick auf den Innenrand, Handy quer.
  - Abschnitt 2 aktualisiert.
- **Geänderte/neue Dateien:** `shared/raeume/arbeitszimmer.js`, `shared/spiel-logik.js`, `test/spiel-logik.test.js`, `public/js/anzeige.js`, `public/js/main.js`, `public/index.html`, `public/css/style.css`, `DOKUMENTATION.md`
- **Genutzte Tools:** Claude Code, Node.js (`node:test`), Google Chrome (headless, DevTools-Protokoll), Git
- **Probleme & Lösungen:**
  - Fehler aus Schritt 3 entdeckt: Ein Klick auf den Innenrand eines Fensters zählt im Browser als Klick auf das Fenster selbst und schloss es ungewollt. Beim Schloss wäre das beim Bedienen der Rädchen störend gewesen → zusätzlich wird geprüft, ob die Klickposition wirklich außerhalb des Fensters liegt. Per Test-Klick bestätigt.
  - Laut Screenshot übernahm der „Öffnen“-Knopf die braune Schrift der Pergament-Fenster. Außerdem zeigte Menlo eine „0“ mit Punkt, was nicht zu einem alten Messingschloss passt → eigene Knopf-Regel; Ziffern in der Systemschrift.
- **Ergebnis:** Das Spiel ist von Anfang bis Ende lösbar: Spuren finden, Code 417 einstellen, Gewinn-Bildschirm. In keiner Ansicht gab es JS-Fehler.
- **Bezug zur Planung:** 2026-10-04, 02:07 – Planung: Erste Version der Escape-Room-WebApp
- **Abweichungen vom Plan:**
  - „Nochmal spielen“ lädt vorerst einfach die Seite neu. Ein richtiger Neustart über die Spiellogik folgt mit dem Timer in Schritt 7.
  - Bekannte Einschränkung für später: Der Code steht in den Raumdaten, die der Browser lädt, und wäre damit für technisch Versierte auslesbar. Für die Einzelspieler-Version ist das unkritisch. Im Mehrspieler-Modus sollte der Server die Codes vor dem Ausliefern entfernen.
- **Git-Commit:** `cfb6d5c`

### 2026-10-04, 11:46 – Schritt 7: Timer und Spielende
- **Auslöser:** Anweisung des Nutzers: „Lies DOKUMENTATION.md und den Plan in docs/plaene/. Schritt 6 ist abgeschlossen. Mach bitte mit Schritt 7 (Timer und Spielende) weiter.“
- **Durchgeführte Schritte:**
  - Raumdaten: `dauerSekunden: 600` ergänzt.
  - Spiellogik: Der Spielstand hat neu `startzeit`, `dauerSekunden`, `endzeit` und den Status „verloren“.
    - `restzeit(spielstand, jetzt)` berechnet die Restzeit jedes Mal neu; nach dem Spielende bleibt sie stehen.
    - `pruefeZeit(spielstand, jetzt)` beendet das Spiel als verloren, sobald die Zeit um ist. Auch jede Aktion prüft zuerst die Zeit.
    - Die neue Aktion `neustart` erzeugt einen frischen Spielstand.
    - Die Logik bekommt die aktuelle Zeit (`jetzt`) übergeben, statt selbst die Uhr abzufragen.
  - Tests auf feste Zeitpunkte umgestellt und 7 neue Tests ergänzt (Timer, Zeitende, eingefrorene Restzeit nach dem Gewinn, Neustart). Insgesamt 21 Tests, alle bestanden.
  - `verbindung-lokal.js` ruft alle 250 ms `pruefeZeit` auf, damit das Spiel auch ohne Klick pünktlich endet.
  - Anzeige:
    - Countdown „⏳ mm:ss“ in der Kopfleiste, in der Systemschrift mit gleich breiten Ziffern; in der letzten Minute rot und pulsierend.
    - Bildschirm „⌛ Zeit abgelaufen“.
    - Das Ende-Fenster zeigt je nach Ergebnis ein eigenes Symbol.
    - Bei einem Statuswechsel zurück auf „läuft“ schließt sich das Ende-Fenster.
  - `main.js`: „Nochmal spielen“ sendet `neustart` statt die Seite neu zu laden. An einer neuen Startzeit erkennt `main.js` ein neues Spiel und kehrt ohne Animation in den Hauptraum zurück. Das funktioniert später auch, wenn im Mehrspieler-Modus jemand anderes neu startet.
  - Sichtprüfung per Screenshot. Für die letzte Minute und das Zeitende wurde im Testbrowser `Date.now` vorgespult. Geprüft wurden: Start, letzte Minute, Zeitende in einer Detailansicht, Neustart danach, Handy quer. Zusätzlich wurde per Skript bestätigt, dass der Timer nach dem Gewinn stehen bleibt und nach dem Neustart wieder 10:00 zeigt.
  - Abschnitt 2 aktualisiert.
- **Geänderte/neue Dateien:** `shared/raeume/arbeitszimmer.js`, `shared/spiel-logik.js`, `test/spiel-logik.test.js`, `public/js/verbindung-lokal.js`, `public/js/anzeige.js`, `public/js/main.js`, `public/index.html`, `public/css/style.css`, `DOKUMENTATION.md`
- **Genutzte Tools:** Claude Code, Node.js (`node:test`), Google Chrome (headless, DevTools-Protokoll), Git
- **Probleme & Lösungen:** keine. Hinweis für den Mehrspieler-Modus: Die Anzeige rechnet die Restzeit mit der Uhr des eigenen Geräts. Weicht diese von der Serveruhr ab, muss die Online-Verbindung den Zeitunterschied ausgleichen.
- **Ergebnis:** Das Spiel hat einen 10-Minuten-Countdown, kann durch Zeitablauf verloren werden und lässt sich ohne Neuladen neu starten. In keiner Ansicht gab es JS-Fehler.
- **Bezug zur Planung:** 2026-10-04, 02:07 – Planung: Erste Version der Escape-Room-WebApp
- **Abweichungen vom Plan:** Zusätzlich gibt es `pruefeZeit()` und das Feld `endzeit`, damit das Spiel ohne Klick endet und die Zeit nach dem Gewinn stehen bleibt. Der Neustart läuft als Aktion über die Spiellogik (in Schritt 6 angekündigt). Die Zeitstrafe für Tipps folgt wie geplant in Schritt 8.
- **Git-Commit:** `09bd894`

### 2026-10-04, 11:52 – Schritt 8: Hilfe-Knopf
- **Auslöser:** Anweisung des Nutzers: „Ja schritt 8 bitte“ (Schritt 8 des freigegebenen Plans).
- **Durchgeführte Schritte:**
  - Raumdaten: `strafeProTippSekunden: 60` und drei gestufte `tipps` ergänzt. Sie reichen vom Hinweis auf die Detailansichten über „Folgt den Farben“ bis zur Lösung 4 – 1 – 7.
  - Spiellogik: Der Spielstand hat neu `genutzteTipps` und `strafSekunden`. Die neue Aktion `tipp` zählt einen Tipp und addiert die Strafe. Das Spielende rückt dadurch nach vorne, sodass Timer, Zeitende und eingefrorene Restzeit automatisch stimmen. Frisst die Strafe die Restzeit auf, ist das Spiel sofort verloren. Mehr Tipps, als der Raum hat, gibt es nicht.
  - 4 neue Tests (insgesamt 25, alle bestanden).
  - Anzeige: Knopf „💡 Hilfe“ in der Kopfleiste. Das Hilfe-Fenster nennt den Preis und listet alle bereits erhaltenen Tipps zum kostenlosen Nachlesen auf. Der Knopf „Tipp x von 3 holen (−1 Min.)“ verschwindet, wenn alle Tipps genutzt sind oder das Spiel vorbei ist. Bei einer Strafe blitzt der Timer kurz rot auf. Die Ende-Bildschirme zeigen eine Statistik: bei Gewinn Restzeit und Tipps, bei Zeitablauf gefundene Spuren und Tipps. Die Zeitformatierung steht jetzt in einer gemeinsamen Funktion `formatiereZeit`.
  - CSS-Klasse `schloss-knoepfe` in `fenster-knoepfe` umbenannt, weil die Knopfzeile jetzt auch im Hilfe-Fenster genutzt wird.
  - Sichtprüfung per Screenshot: Hilfe-Fenster vor dem ersten Tipp, nach einem Tipp (Timer 09:59 → 08:59 mit Aufblitzen), nach allen Tipps, Gewinn mit Statistik, Zeitablauf mit Statistik, Handy quer in zwei Größen (844×390 und 667×375).
  - Abschnitt 2 aktualisiert.
- **Geänderte/neue Dateien:** `shared/raeume/arbeitszimmer.js`, `shared/spiel-logik.js`, `test/spiel-logik.test.js`, `public/js/anzeige.js`, `public/js/main.js`, `public/index.html`, `public/css/style.css`, `DOKUMENTATION.md`
- **Genutzte Tools:** Claude Code, Node.js (`node:test`), Google Chrome (headless, DevTools-Protokoll), Git
- **Probleme & Lösungen:** keine
- **Ergebnis:** Der Hilfe-Knopf liefert drei gestufte Tipps gegen jeweils 1 Minute Zeitstrafe, und die Ende-Bildschirme zeigen eine kurze Auswertung. In keiner Ansicht gab es JS-Fehler.
- **Bezug zur Planung:** 2026-10-04, 02:07 – Planung: Erste Version der Escape-Room-WebApp
- **Abweichungen vom Plan:** Zusätzlich zeigt auch der Zeitablauf-Bildschirm eine Statistik (gefundene Spuren und Tipps), nicht nur der Gewinn-Bildschirm. Erhaltene Tipps lassen sich kostenlos nachlesen. Ein Tipp, dessen Strafe die Restzeit übersteigt, beendet das Spiel sofort.
- **Git-Commit:** `54e62b6`

### 2026-10-04, 20:56 – Planung: Startseite, Schwierigkeitsgrade und Vorgeschichte
- **Auslöser:** Anweisung des Nutzers: „Okay dann mache jetzt Schritt 9. ich möchte auch eine spannende Vorgschichte für diesen Raum. Es wäre doch auch cool, wenn die Räume auf einander aufbauen. Die Schwierigkeit mit jedem Raum steigt und man am Ende den Professor findet bzw. das Geheimnis aufdeckt oder das Rätsel löst. Außerdem musst du mir bescheid geben, falls du Bilder zum Austauschen der Grafik von mir brauchst“
- **Ausgangsidee:** Schritt 9 des ursprünglichen Plans (Startseite mit Raumauswahl und Anleitung), erweitert um eine Vorgeschichte und um Räume, die aufeinander aufbauen.
- **Rückfragen & Antworten:**
  - Erste Rückfragen zur raumübergreifenden Geschichte (Geheimnis, Anzahl Räume, Freischalten, Darstellung) → von der Nutzerin abgebrochen und geändert: „Keine Geschichte, die sich über mehrere Räume zieht, und kein Gesamträtsel am Ende. Jeder Raum soll inhaltlich eigenständig sein. […] Die Räume sollen unterschiedliche Schwierigkeitsgrade haben, und spätere Räume werden schwieriger als frühere. Jeder Raum hat dabei einen festen Schwierigkeitsgrad. […] Außerdem möchte ich eine spannende Vorgeschichte, aber nur für diesen einen Raum“. Die verworfene Idee soll in `docs/ideen.md` eingetragen werden.
  - Frage: Wer ist die Spielfigur? → Antwort: Studierende/r
  - Frage: Warum sitzt man im Arbeitszimmer fest? → Antwort: Die Tür fällt hinter einem ins Schloss.
  - Frage: Wie soll die Vorgeschichte erscheinen? → Antwort: Intro und Abschluss (Empfehlung übernommen)
  - Frage: Begründung für die verworfene Idee (in der Vorgabe stand noch ein Platzhalter) → Antwort im Wortlaut übernommen (siehe `docs/ideen.md`). Daraus abgeleitet: Räume sind frei wählbar, nach Schwierigkeit sortiert.
  - Ergänzung der Nutzerin vor der Freigabe: Später sollen KI-generierte Videos (z. B. mit Gemini) für Intro, Sieg und Zeitablauf aus Sicht der Studierenden eingebunden werden. Das soll jetzt vorbereitet werden, mit Überspringen-Knopf, Text als Untertitel bzw. Ersatz und unter Beachtung der Autoplay-Regeln; benötigte Videos gehören in die Anleitung.
  - Ergänzung der Nutzerin: Neues Ende bei Zeitablauf. Der Hausmeister findet einen („Schritte auf dem Flur. Sie werden langsamer und bleiben direkt vor der Tür stehen. Stille. Ein Schlüssel dreht sich im Schloss, die Tür fliegt auf, und grelles Taschenlampenlicht trifft dich mitten ins Gesicht. ‚Was machen Sie hier drin?!‘ Der Hausmeister. Das Rätsel um Professor Albers bleibt ungelöst.“). Dazu ein Schreckmoment mit Einblendung und Soundeffekt, auch ohne Video, ohne schnell blinkende Effekte, mit angemessener Lautstärke und einem Hinweis auf der Raumkarte.
  - Ergänzung der Nutzerin: Jeder spätere Raum bekommt eine eigene Vorgeschichte mit Intro und Outro (Text, optional Video), in der Anleitung unter „Neuen Raum anlegen“. Der Schreckmoment ist pro Raum optional und ausdrücklich abschaltbar; der Karten-Hinweis erscheint nur bei Räumen mit Schreck.
- **Kurzfassung des Plans:**
  - Startseite `index.html` mit Raumkarten (Schwierigkeit, Dauer, Kurzbeschreibung, Schreck-Hinweis); das Spiel zieht nach `spiel.html?raum=<id>` um; die Raumliste steht in `shared/raeume/index.js`.
  - Neuer Spielstatus „bereit“ mit Aktion `start`, damit der Timer erst mit „Raum betreten“ läuft.
  - Geschichte (Intro, Outro, Verloren-Text, optionale Videos, Schreck an/aus) in den Raumdaten, abgesichert durch Tests.
  - Neues Modul `geschichte.js` für Text und Video mit Überspringen und Text-Ersatz.
  - Schreckmoment: ruhiger Spannungsaufbau, eine einzelne Lichteinblendung und Ton (Ersatzton per Web Audio, solange keine Datei da ist).
  - `docs/anleitung.md` mit Anleitungen und Liste aller benötigten Grafiken, Videos und des Sounds.
  - Umsetzung in den Teilschritten 9a–9d.
- **Plandatei:** [`docs/plaene/2026-10-04_startseite-und-vorgeschichte.md`](docs/plaene/2026-10-04_startseite-und-vorgeschichte.md)
- **Verworfene Ideen & Alternativen:**
  - Raumübergreifende Geschichte mit Gesamträtsel (siehe [`docs/ideen.md`](docs/ideen.md)) und dazu vorgeschlagene Geheimnisse (Himmelsentdeckung, Geheimbund, Schatzsuche, Zeiträtsel).
  - Räume nacheinander freischalten (vorerst).
  - Spielfigur als Assistent/in oder Detektiv/in.
  - Auslöser „Prüfung des Professors“ bzw. „Jemand sperrt ab“.
  - Vorgeschichte nur als Intro oder nur auf der Startseite.
  - Erster Entwurf des Verloren-Endes („Nacht im Arbeitszimmer verbringen“).
  - Schreckmoment automatisch für jeden Raum.
- **Git-Commit:** wird mit diesem Eintrag erstellt (siehe Commit „Doku: Planung zu Startseite und Vorgeschichte“)

### 2026-10-04, 20:59 – Schritt 9a: Startseite und Schwierigkeitsgrade
- **Auslöser:** Anweisung des Nutzers: Freigabe des Plans „Startseite, Schwierigkeitsgrade und Vorgeschichte“ und „mache weiter“. Dies ist Teilschritt 9a.
- **Durchgeführte Schritte:**
  - `shared/raeume/index.js` angelegt: Liste aller Räume, Bezeichnungen der Schwierigkeitsgrade, `findeRaum(id)`.
  - Raumdaten des Arbeitszimmers um `schwierigkeit: 1`, `kurzbeschreibung` und `vorschaubild: null` ergänzt.
  - Das bisherige Spiel nach `public/spiel.html` verschoben; in der Kopfleiste kam der Link „← Räume“ dazu.
  - `main.js` lädt den Raum jetzt aus der Adresse (`?raum=<id>`). Ist der Raum unbekannt, geht es zurück zur Startseite.
  - Neue Startseite `public/index.html` mit `public/js/start.js`: eine Karte pro Raum mit Vorschau (Platzhalter-Hintergrund der Startszene), Titel, Sternen und Schwierigkeit, Dauer, Kurzbeschreibung und „Spielen“. Auf schmalen Bildschirmen steht das Bild über dem Text.
  - Neue Tests in `test/raeume.test.js`: gültiger Schwierigkeitsgrad, spätere Räume nicht leichter als frühere, eindeutige IDs, Kurzbeschreibung vorhanden, `findeRaum`. Insgesamt 29 Tests, alle bestanden.
  - Sichtprüfung per Screenshot: Startseite auf Desktop und Handy hochkant, Spielseite nach „Spielen“, Handy quer, Weiterleitung bei unbekanntem Raum.
  - Abschnitt 2 aktualisiert.
- **Geänderte/neue Dateien:** `shared/raeume/index.js`, `shared/raeume/arbeitszimmer.js`, `public/index.html`, `public/spiel.html`, `public/js/start.js`, `public/js/main.js`, `public/css/style.css`, `test/raeume.test.js`, `DOKUMENTATION.md`
- **Genutzte Tools:** Claude Code, Node.js (`node:test`), Google Chrome (headless, DevTools-Protokoll), Git
- **Probleme & Lösungen:** keine
- **Ergebnis:** `localhost:3000` zeigt die Raumauswahl; „Spielen“ startet das Arbeitszimmer. Der Aufbau ist für weitere Räume mit steigendem Schwierigkeitsgrad vorbereitet. In keiner Ansicht gab es JS-Fehler.
- **Bezug zur Planung:** 2026-10-04, 20:56 – Planung: Startseite, Schwierigkeitsgrade und Vorgeschichte
- **Abweichungen vom Plan:** Die Raumliste wird nicht automatisch sortiert. Neue Räume werden in der Reihenfolge ihrer Schwierigkeit hinten angehängt, und ein Test schlägt fehl, wenn ein späterer Raum leichter ist. So bleibt die Vorgabe „spätere Räume sind schwerer“ beim Anlegen sichtbar.
- **Git-Commit:** `496afc6`

### 2026-10-04, 21:03 – Schritt 9b: Vorgeschichte
- **Auslöser:** Anweisung des Nutzers: Freigabe des Plans „Startseite, Schwierigkeitsgrade und Vorgeschichte“ und „mache weiter“. Dies ist Teilschritt 9b.
- **Durchgeführte Schritte:**
  - Spiellogik:
    - Neuer Status `bereit`: `erstelleSpielstand(raum)` beginnt ohne Startzeit.
    - Die neue Aktion `start` setzt Startzeit und Status `laeuft`.
    - Vor dem Start bleibt die Restzeit voll, die Zeit läuft nicht ab, und andere Aktionen wirken nicht.
    - `neustart` beginnt direkt mit `laeuft`, ohne erneutes Intro.
  - Tests auf „erstellt und gestartet“ umgestellt und 4 neue Tests zum Status `bereit` ergänzt. Dazu ein Test, dass jeder Raum Intro (mit Titel), Outro und Verloren-Text hat. Insgesamt 34 Tests, alle bestanden.
  - Raumdaten: `geschichte` mit Intro „Ein offenes Arbeitszimmer“ (3 Absätze), Outro (Umschlag mit Nachricht des Professors) und Verloren-Text (Spannungssatz und Hausmeister-Szene im Wortlaut der Nutzerin).
  - Neues Modul `public/js/geschichte.js`, das Absätze anzeigt (Grundlage für die Videos in 9c).
  - Intro-Fenster: fast schwarzer Hintergrund, Titel und Absätze blenden nacheinander ein (nicht bei „Bewegung reduzieren“), Knopf „Raum betreten“, nicht mit Esc schließbar.
  - Die Ende-Bildschirme zeigen die Texte aus den Raumdaten statt fester Texte in `anzeige.js` und haben zusätzlich „Zur Raumauswahl“.
  - Sichtprüfung per Screenshot: Intro (Desktop und Handy quer), Sieg, Zeitablauf (Desktop und Handy quer), Neustart. Per Skript bestätigt: Der Timer bleibt vor dem Start bei 10:00 und läuft danach; ein Neustart öffnet kein Intro.
- **Geänderte/neue Dateien:** `shared/spiel-logik.js`, `shared/raeume/arbeitszimmer.js`, `public/js/geschichte.js`, `public/js/anzeige.js`, `public/js/main.js`, `public/js/verbindung-lokal.js`, `public/spiel.html`, `public/css/style.css`, `test/spiel-logik.test.js`, `test/raeume.test.js`, `DOKUMENTATION.md`
- **Genutzte Tools:** Claude Code, Node.js (`node:test`), Google Chrome (headless, DevTools-Protokoll), Git
- **Probleme & Lösungen:** Auf dem Handy quer passte der Zeitablauf-Bildschirm mit dem längeren Text nur knapp, das Symbol war oben abgeschnitten → auf niedrigen Bildschirmen wird das Symbol ausgeblendet und der Innenabstand verkleinert.
- **Ergebnis:** Vor dem Raum erscheint die Vorgeschichte, und der Timer läuft erst nach „Raum betreten“. Nach dem Sieg folgt die Nachricht des Professors, bei Zeitablauf die Hausmeister-Szene. In keiner Ansicht gab es JS-Fehler.
- **Bezug zur Planung:** 2026-10-04, 20:56 – Planung: Startseite, Schwierigkeitsgrade und Vorgeschichte
- **Abweichungen vom Plan:** Das Feld `schreck` und die Video-Felder kommen erst mit 9c in die Raumdaten, zusammen mit der Funktion, die sie nutzt.
- **Git-Commit:** `06c9325`

### 2026-10-04, 21:15 – Schritt 9c: Schreckmoment und Video-Unterstützung
- **Auslöser:** Anweisung des Nutzers: Freigabe des Plans „Startseite, Schwierigkeitsgrade und Vorgeschichte“ und „mache weiter“. Dies ist Teilschritt 9c. Er setzt die vor der Freigabe ergänzten Wünsche nach Videos und Schreckmoment um.
- **Durchgeführte Schritte:**
  - Raumdaten:
    - `video: null` bei Intro, Outro und Verloren-Text.
    - `schreck: { sound: null }` beim Arbeitszimmer (Schreck an, eingebauter Ersatzton).
    - Kommentare erklären die Möglichkeiten: `null` = aus, eigener Sound per Pfad.
  - Zwei neue Tests: Jeder Raum setzt `schreck` ausdrücklich (`null` oder Objekt mit `sound`), und Video-Angaben sind `null` oder ein Pfad. Insgesamt 36 Tests, alle bestanden.
  - `public/js/geschichte.js` erweitert:
    - **Video-Abspieler** (`<video playsinline>`): Knopf „Überspringen ⏭“; Endet das Video oder fehlt die Datei, verschwindet es und der Text bleibt. Blockiert der Browser das automatische Abspielen, erscheint „▶ Abspielen“.
    - **Spannungsaufbau:** Der Text erscheint Satz für Satz auf einer abgedunkelten Ebene, etwa 5 s.
    - **Schreckmoment:** eine einzelne Lichtkegel-Einblendung, die über 1,3 s verblasst (kein Blinken). Bei „Bewegung reduzieren“ fällt sie sanfter und weniger hell aus. Dazu kommt der Ton mit 60 % Lautstärke.
    - **Ersatzton per Web Audio API:** tiefer Schlag, Rauschen und ein schräger Akzent aus zwei Tönen.
    - **Ton-Freigabe** beim Klick auf „Raum betreten“ bzw. „Nochmal spielen“ (AudioContext fortsetzen bzw. Sounddatei stumm anspielen).
  - `anzeige.js`:
    - Ablauf bei Zeitablauf: Spannung, dann Schreck (falls an), dann der Ende-Bildschirm mit dem restlichen Text. Ein Verloren-Video ersetzt Spannung und Schreck, der ganze Text bleibt als Untertitel.
    - Das Outro-Video startet im Ende-Fenster.
    - Im Intro erscheint der Knopf „▶ Geschichte ansehen“ nur, wenn es ein Video gibt. Das Video startet erst nach diesem Klick (Autoplay-Regeln).
    - Videos stoppen, sobald ihr Fenster geschlossen wird.
  - Startseite: Der Hinweis „⚠ Enthält einen Schreckmoment mit Ton“ erscheint nur bei Räumen mit `schreck`.
  - Intro- und Ende-Fenster: Bei Platzmangel scrollt nur der Text, Video und Knöpfe bleiben sichtbar.
  - Prüfung mit einem Testserver und einem selbst aufgenommenen 4-s-WebM-Testvideo (beides nur im Scratchpad, nicht im Projekt). Geprüft wurden vier Varianten: Schreck an, Schreck aus, mit Video, Video-Datei fehlt. Dazu Screenshots auf Desktop und Handy quer.
- **Geänderte/neue Dateien:** `shared/raeume/arbeitszimmer.js`, `public/js/geschichte.js`, `public/js/anzeige.js`, `public/js/start.js`, `public/spiel.html`, `public/css/style.css`, `test/raeume.test.js`, `DOKUMENTATION.md`
- **Genutzte Tools:** Claude Code, Node.js (`node:test`), Google Chrome (headless, DevTools-Protokoll, MediaRecorder für das Testvideo), Git
- **Probleme & Lösungen:**
  - Beim ersten Test schienen Ton und Ende-Bildschirm zu fehlen. Ursache war das Testskript, dessen Warteschleife nach 4 s aufgab, bevor der Schreck kam. Nach der Korrektur bestätigt: Der Schreck kommt nach 5,7 s, der AudioContext läuft, die Klangquellen werden erzeugt, und danach öffnet sich das Ende-Fenster.
  - Der Spannungsaufbau war mit etwa 7,6 s länger als geplant → Pausen pro Satz verkürzt (etwa 5 s).
  - Mit Video war das Intro höher als der Bildschirm, „Raum betreten“ lag außerhalb → Intro und Ende als Flex-Spalte, nur der Text scrollt. Auf niedrigen Bildschirmen sind Video und Titel kleiner.
  - Ton lässt sich per Screenshot nicht prüfen; geprüft wurde per Skript, dass er ohne Fehler erzeugt wird. Hören muss ihn die Nutzerin selbst.
- **Ergebnis:**
  - Bei Zeitablauf baut sich Spannung auf, dann folgt der Schreck mit Licht und Ton und schließlich die Hausmeister-Szene.
  - Ein Raum kann den Schreck ausdrücklich abschalten.
  - Videos lassen sich später einfach durch Eintragen des Pfads einbinden; ohne Video funktioniert alles mit Text.
  - In keiner Variante gab es JS-Fehler.
- **Bezug zur Planung:** 2026-10-04, 20:56 – Planung: Startseite, Schwierigkeitsgrade und Vorgeschichte
- **Abweichungen vom Plan:**
  - Das Feld `schreck` enthält nur `sound`, kein `bild`: Die Lichteinblendung ist fest eingebaut, ein eigenes Schreckbild war nicht gefordert.
  - Ohne Schreck, aber mit Spannungstext läuft der Spannungsaufbau trotzdem, danach folgt direkt der Ende-Bildschirm.
- **Git-Commit:** `c8ca67b`

### 2026-10-04, 21:34 – Schritt 9d: Anleitung und Dateiliste
- **Auslöser:** Anweisung des Nutzers: Freigabe des Plans „Startseite, Schwierigkeitsgrade und Vorgeschichte“ und „mache weiter“. Dies ist Teilschritt 9d. Er erfüllt auch den Wunsch: „Außerdem musst du mir bescheid geben, falls du Bilder zum Austauschen der Grafik von mir brauchst“.
- **Durchgeführte Schritte:**
  - `docs/anleitung.md` angelegt:
    - Spiel starten.
    - Grafik austauschen, inklusive Erklärung zu Kasten und Seitenverhältnis.
    - Video und Ton einbinden, mit Hinweisen zu Autoplay und Überspringen sowie zum Verloren-Video, das den Schreck ersetzt.
    - Neuen Raum anlegen in 7 Schritten: eigene Geschichte mit Intro und Outro, Schwierigkeitsgrad, Schreckmoment bewusst an oder aus, eigene Ordner für Bilder, Videos und Töne, Eintrag in die Raumliste, `npm test`.
    - Vollständige Liste aller benötigten Dateien für das Arbeitszimmer: 4 Hintergründe, 13 Gegenstände, 1 Vorschaubild, 3 optionale Videos, 1 Sound. Jeweils mit Dateiname, Feld in der Raumdatei, Format, Größe bzw. Seitenverhältnis, Länge und Motiv.
    - Ein Vorschlag für einen einheitlichen Stil-Prompt.
  - Die Seitenverhältnisse der Gegenstände wurden aus den Kästen in den Raumdaten berechnet (bezogen auf 1920×1080).
  - Medienordner `public/bilder/arbeitszimmer/`, `public/videos/arbeitszimmer/` und `public/toene/arbeitszimmer/` angelegt (mit `.gitkeep`, da Git keine leeren Ordner speichert).
  - Abschnitt 2 auf den Endstand der ersten Version gebracht und gegliedert.
- **Geänderte/neue Dateien:** `docs/anleitung.md`, `public/bilder/arbeitszimmer/.gitkeep`, `public/videos/arbeitszimmer/.gitkeep`, `public/toene/arbeitszimmer/.gitkeep`, `DOKUMENTATION.md`
- **Genutzte Tools:** Claude Code, Node.js (Berechnung der Seitenverhältnisse), Git
- **Probleme & Lösungen:** Abschnitt 2 wurde über eine Zwischendatei ersetzt. Ein Vergleich vorher/nachher bestätigte, dass Kopf, Abschnitt 3 und das Protokoll unverändert blieben.
- **Ergebnis:** Die erste Version ist abgeschlossen. Die Nutzerin hat eine Liste aller Grafiken, Videos und Töne, die sie liefern kann, und eine Anleitung zum Einbinden sowie zum Anlegen weiterer Räume.
- **Bezug zur Planung:** 2026-10-04, 20:56 – Planung: Startseite, Schwierigkeitsgrade und Vorgeschichte
- **Abweichungen vom Plan:** Zusätzlich wurden die Medienordner schon angelegt, damit Dateien direkt abgelegt werden können.
- **Git-Commit:** `e0bc26a`

### 2026-10-20, 10:17 – AGENTS.md für die Arbeit mit Codex
- **Auslöser:** Anweisung des Nutzers: „Doch ich würde nämlich gerne parallel auch mit Codex arbeiten bzw. im Wechsel. Dafür sollte die Agents.md sein denke ich. Meine Idee ist, wenn ich hier mein Nutzungskontingent aufgebraucht habe für den Tag, würde ich mit Codex weiter machen.“
- **Durchgeführte Schritte:**
  - Die von der Nutzerin angelegte `AGENTS.md` geprüft: Sie ist inhaltlich gleich mit `CLAUDE.md`, nur „Claude“ ist durch „Codex“ ersetzt.
  - `AGENTS.md` committet.
  - Kopf der Dokumentation und Werkzeuge in Abschnitt 1 um Codex ergänzt, Entscheidung in Abschnitt 3 eingetragen.
- **Geänderte/neue Dateien:** `AGENTS.md`, `DOKUMENTATION.md`
- **Genutzte Tools:** Claude Code, Git
- **Probleme & Lösungen:** keine
- **Ergebnis:** Codex findet beim Start im Projekt dieselben Regeln für Commits, Dokumentation und Plan-Modus wie Claude Code.
- **Bezug zur Planung:** keiner
- **Abweichungen vom Plan:** keine
- **Git-Commit:** `180c184`

### 2026-10-20, 10:23 – Varianten für Anmeldung und gemeinsames Spielen gesammelt
- **Auslöser:** Anweisung des Nutzers: „Wir können aber auch jetzt schon in den weiteren Plan aufnehmen, dass ich gerne mit Vercel und Supabase arbeiten und hosten möchte. Es sollen schließlich Leute sich anmelden können und gemeinsam einen Raum spielen können.“ Auf den ersten Entwurf (nur Vercel und Supabase) folgte: „Übernehme beide Varianten bezüglich der Datenbank und des Hostings. Ich möchte deine erste Idee auch drin haben.“ Außerdem bat die Nutzerin darum, ihr Zitat professioneller als Ziel zu formulieren.
- **Durchgeführte Schritte:**
  - In `docs/ideen.md` einen Eintrag mit Ziel und zwei Varianten angelegt, Status „offen“:
    - Variante A: eigener Express-Server mit Socket.IO bei Render (ursprünglicher Vorschlag von Claude aus dem Plan der ersten Version).
    - Variante B: Vercel mit Supabase Auth, Datenbank und Realtime (Wunsch der Nutzerin).
    - Je Variante Funktionsweise, Vorteile und Nachteile sowie offene Fragen für die spätere Planung.
  - Tech-Stack in Abschnitt 1 angepasst.
  - Der Nutzerin erklärt, dass Variante A ein eigener Vorschlag war und nicht aus Seminarvorgaben stammt (laut erster Planung gibt es keine).
- **Geänderte/neue Dateien:** `docs/ideen.md`, `DOKUMENTATION.md`
- **Genutzte Tools:** Claude Code, Git
- **Probleme & Lösungen:** Vercel kann keine dauerhaften WebSocket-Verbindungen halten, Socket.IO funktioniert dort also nicht. In Variante B übernimmt deshalb Supabase Realtime die Live-Synchronisation.
- **Ergebnis:** Beide Varianten sind nachvollziehbar festgehalten. Die Entscheidung fällt in einer eigenen Planung im Plan-Modus, deshalb noch kein Eintrag in Abschnitt 3.
- **Bezug zur Planung:** keiner
- **Abweichungen vom Plan:** keine
- **Git-Commit:** `3453c10`

### 2026-10-22, 11:52 – Ergebnisse der Mehrspieler-Planung mit ChatGPT übernommen
- **Auslöser:** Anweisung des Nutzers nach einem eigenen Planungsgespräch mit ChatGPT: „Ich habe mein Escape-Room-Projekt mit ChatGPT besprochen. Übernimm die folgenden Ergebnisse nachvollziehbar in die bestehende Projektdokumentation.“ Der Auftrag enthielt die beschlossene Richtung und die Prioritäten, das Architekturziel, den ersten Mehrspieler-Meilenstein und offene Entscheidungen. Er beschränkte sich ausdrücklich auf die Dokumentation: keine Code-Änderungen, keine Einrichtung externer Dienste, keine neuen Markdown-Dateien, offene Details nicht als beschlossen darstellen, Arbeitsregeldateien und historische Pläne unverändert lassen. Die technischen Einschätzungen stammen aus diesem Gespräch und sind keine Vorgaben des Dozenten.
- **Durchgeführte Schritte:**
  - `CLAUDE.md`, `DOKUMENTATION.md`, `docs/ideen.md`, `server.js`, `public/js/verbindung-lokal.js`, `public/js/main.js`, `shared/spiel-logik.js` und `shared/raeume/arbeitszimmer.js` gelesen und die Einordnung als Einzelspieler-Prototyp mit dem Code abgeglichen. Bestätigt:
    - Spielstand und Timer liegen nur im Browser, die Zeit kommt von der Geräteuhr, und nach dem Neuladen startet das Spiel neu.
    - Schlosscode und Tipps sind über `/shared` öffentlich abrufbar.
    - Raumvorlage und Sitzung sind nicht getrennt.
    - Spiellogik und Verbindungsschicht sind als Grundlage wiederverwendbar.
  - Die Aussage „Vercel kann keine dauerhaften WebSocket-Verbindungen halten“ (Eintrag vom 2026-10-20 und `docs/ideen.md`) anhand der offiziellen Vercel-Dokumentation geprüft. Sie ist veraltet:
    - Vercel Functions bedienen WebSocket-Verbindungen auf allen Tarifen, auch mit Socket.IO. Seit Ende Juni 2026 war das in der Public Beta, seit dem 2026-10-20 ist es allgemein verfügbar.
    - Voraussetzung ist Fluid compute.
    - Verbindungen enden spätestens mit der maximalen Funktionsdauer (Hobby: 300 s; Pro und Enterprise: bis 800 s).
    - Gemeinsamer Zustand gehört in einen externen Speicher.
    - Quellen: [Vercel Docs: WebSockets](https://vercel.com/docs/functions/websockets), [Vercel Changelog: WebSocket support is now generally available](https://vercel.com/changelog/websocket-support-is-now-generally-available), [Vercel Docs: Functions Limits](https://vercel.com/docs/functions/limitations), abgerufen am 2026-10-22.
  - `docs/ideen.md`:
    - Vercel und Supabase als gewählte Richtung gekennzeichnet, Variante A als derzeit nicht gewählt. Der Text vom 2026-10-20 bleibt erhalten.
    - Korrekturhinweis zu WebSockets mit Quellen ergänzt.
    - Abschnitt „Stand nach der Planung mit ChatGPT“ mit offenen Fragen angelegt.
    - Neue Einträge „Rangliste mit Anzeigenamen und Bestzeiten“ (geplant) und „Gestaltung und Atmosphäre“ (offen).
  - Abschnitt 1: geplanter Tech-Stack (Vercel, Supabase, CI) als „noch nicht umgesetzt“ gekennzeichnet, ChatGPT bei den Werkzeugen ergänzt.
  - Abschnitt 2: Einordnung als Einzelspieler-Prototyp, gegliedert in „Umgesetzt“ (unverändert, dazu die Grenzen des Prototyps) und „Geplant (noch nicht umgesetzt)“.
  - Abschnitt 3: acht Entscheidungen eingetragen (Priorität Mehrspieler, Vercel und Supabase, Frontend ohne Framework, Architekturziel, erster Meilenstein, CI und bewusste Deployments, Rangliste, Abstimmung der Gestaltung).
- **Geänderte/neue Dateien:** `DOKUMENTATION.md`, `docs/ideen.md`
- **Genutzte Tools:** Claude Code (Websuche und Abruf der Vercel-Dokumentation), Git; Planungsgespräch der Nutzerin mit ChatGPT (außerhalb dieses Projekts)
- **Probleme & Lösungen:**
  - Die frühere Aussage zu WebSockets auf Vercel war veraltet. Sie war am 2026-10-20 geschrieben worden, dem Tag, an dem Vercel die allgemeine Verfügbarkeit meldete; die Public Beta lief schon seit Juni 2026. Der historische Protokolleintrag bleibt unverändert, die Korrektur steht in `docs/ideen.md` und in diesem Eintrag.
  - Die Vercel-Wissensdatenbank bezeichnet WebSockets noch als Public Beta, Dokumentation und Changelog dagegen als allgemein verfügbar. Übernommen wurde der neuere Stand aus dem Changelog vom 2026-10-20.
- **Ergebnis:**
  - Die Mehrspieler-Richtung ist mit Begründungen dokumentiert, und der umgesetzte Stand ist klar vom geplanten getrennt.
  - Offen bleiben: Kontopflicht oder Gastzugang, maximale Gruppengröße, Rechte für Start, Neustart und Tipps, Verlassen der Sitzung durch die erstellende Person, Beenden und Aufräumen von Sitzungen, Aufteilung zwischen Edge Functions und Datenbank, Umgang mit gleichzeitigen Aktionen, Rolle von `server.js`, Anmeldearten sowie Einzel- und Teamwertung der Rangliste.
  - Als Nächstes werden Datenmodell, Schnittstellen und Berechtigungsregeln gemeinsam ausgearbeitet.
- **Bezug zur Planung:** keiner (die Planung fand im Gespräch der Nutzerin mit ChatGPT statt, nicht im Plan-Modus; es gibt keine Plandatei)
- **Abweichungen vom Plan:** keine
- **Git-Commit:** keiner (keine Code-Änderung)

### 2026-10-22, 13:13 – Planung: Mehrspieler-Grundlage mit Supabase
- **Auslöser:** Anweisung des Nutzers: „Plane die nächste Entwicklungsphase anhand des aktuellen Codes, der bestehenden Dokumentation und unserer Arbeitsregeln. Noch nichts implementieren oder an externen Diensten ändern. Verbindlicher Zielumfang sind insgesamt drei eigenständige Escape Rooms. Multiplayer hat Priorität: gemeinsame Spielsitzungen sowie gleichzeitig unabhängige Sitzungen derselben Raumvorlage müssen funktionieren.“ Verlangt waren: Supabase-Grundlage, Datenmodell, Trennung öffentlicher und geheimer Daten, Aufgabenverteilung, Erweiterbarkeit für Rätseltypen und kleine Umsetzungsschritte bis zum ersten Mehrspieler-Meilenstein.
- **Ausgangsidee:** Die Ergebnisse der Planung mit ChatGPT (Eintrag vom 2026-10-22, 11:52) in einen umsetzbaren Plan überführen. Grundlage war der Abgleich mit dem Code: Spielstand nur im Browser, Lösungen öffentlich, Raumvorlage und Sitzung nicht getrennt, Spiellogik als reine Funktionen wiederverwendbar.
- **Rückfragen & Antworten:**
  - Frage: Womit melden sich Spielende für den ersten Meilenstein an? → Antwort: Gastzugang zuerst (Empfehlung übernommen)
  - Frage: Soll man weiterhin offline allein spielen können? → Antwort: Nur online (Empfehlung übernommen)
  - Kommentar der Nutzerin zum ersten Entwurf: „Bestätigte Spielregeln übernehmen. Nur der Ersteller startet; maximal vier Personen; erneutes Spielen erzeugt eine neue Sitzung.“
  - Überarbeitungswünsche der Nutzerin zum zweiten Entwurf:
    - **CI:** Claude richtet die GitHub-Actions-Pipeline ein (feste Node-Version, `npm ci`, vorhandene Tests). Mit dem Backend kommen Integrationsprüfungen dazu. Lokal und in der CI gelten dieselben Befehle, es gibt kein automatisches Deployment.
    - **Supabase:** lokal mit CLI und Docker-kompatibler Laufzeit. Die CI baut eine frische Testumgebung und verändert nie das Cloud-Projekt.
    - **Branches:** Arbeitspakete auf eigenen Branches, Pull Request nach Prüfung, Merge nach Freigabe.
    - **Spielregeln:** Beitritt per Code, Laden per ID nur für Mitglieder, alle dürfen Tipps anfordern, keine „Runde“.
    - **Daten und Ablauf:** eine Raumversion speichern. Aktionseintrag und Spielstandänderung atomar. Gruppengrenze und Beitritte gegen gleichzeitige Zugriffe absichern. Zeitablauf erkennt der Server beim Laden, Wiederbeitritt und bei Aktionen.
  - Ergänzungen der Nutzerin bei der Freigabe:
    - Schreibende Datenbankfunktionen darf nur das Backend aufrufen, das wird getestet.
    - Beim Wiederverbinden verhindert ein erneuter Abgleich zwischen Laden und Abonnement, dass Änderungen verpasst werden.
    - Vor AP 5 wird ein manuell ausgelöster Deployment-Workflow konkretisiert, jetzt wird keine Veröffentlichung eingerichtet.
    - Danach zunächst nur AP 1 auf dem Branch `ap1-ci` umsetzen.
- **Kurzfassung des Plans:**
  - **Datenmodell:** `sitzungen` (Spielstand als `jsonb` mit Versionsnummer, `raum_id`, `raum_version`, Beitrittscode), `sitzung_mitglieder`, `aktionen` (gegen Doppelverarbeitung). Raumvorlagen bleiben im Code.
  - **Raumdaten:** je Raum eine öffentliche und eine geheime Datei. Die Spiellogik wird im Backend weiterverwendet, dazu kommt ein Rätseltyp-Register mit der allgemeinen Aktion `loese`.
  - **Edge Functions:** `sitzung-erstellen`, `sitzung-beitreten`, `sitzung-laden` und `aktion`.
  - **Datenbank:** atomare Datenbankfunktionen mit Versionsprüfung und Zeilensperre beim Beitritt, nur für das Backend aufrufbar. RLS erlaubt Mitgliedern nur Lesen, Realtime verteilt bestätigte Änderungen.
  - **Supabase lokal** für Entwicklung und CI, das Cloud-Projekt erst ab AP 5.
  - **Arbeitspakete:**
    1. CI
    2. Trennung der Raumdaten
    3. Backend lokal
    4. Online-Spiel (Meilenstein 1 lokal)
    5. Cloud und Vercel (Meilenstein 1 auf Geräten)
    6. Raum 2
    7. Raum 3
- **Plandatei:** [`docs/plaene/2026-10-22_mehrspieler-grundlage.md`](docs/plaene/2026-10-22_mehrspieler-grundlage.md)
- **Verworfene Ideen & Alternativen:**
  - Fortschritt in normalisierten Tabellen
  - Raumvorlagen in der Datenbank
  - Event-Sourcing
  - Offline-Modus
  - E-Mail-Konto ab Meilenstein 1
  - Realtime-Broadcast statt Postgres Changes
  - nur mit dem Cloud-Projekt arbeiten
  - CI gegen das Cloud-Projekt
  - pgTAP als zweites Test-Werkzeug
  - Neustart innerhalb einer Sitzung über eine „Runde“
  - alle Mitglieder dürfen starten
  - Squash- oder Rebase-Merge
  - Ablaufmeldung durch den Browser
- **Git-Commit:** wird mit diesem Eintrag erstellt (siehe Commit „Doku: Planung zu Mehrspieler-Grundlage“)

### 2026-10-22, 13:17 – AP 1: CI mit GitHub Actions
- **Auslöser:** Anweisung des Nutzers bei der Freigabe des Plans: „Dokumentiere den freigegebenen Plan gemäß Projektregeln und setze anschließend zunächst nur AP 1 auf dem Branch ap1-ci um. Prüfe die Tests lokal und in GitHub Actions und bereite den Pull Request vor.“ Laut Plan übernimmt Claude die technische Einrichtung der Pipeline: zuerst prüfen, ob schon Workflows existieren, dann feste Node-Version, `npm ci`, vorhandene Tests, kein automatisches Deployment.
- **Durchgeführte Schritte:**
  - Geprüft: Es gab noch kein `.github/` und keine Workflows.
  - Branch `ap1-ci` von `main` angelegt.
  - `.nvmrc` mit Node-Version 24 angelegt (lokal läuft Node 24) und `engines` (`24.x`) in `package.json` ergänzt; `package-lock.json` per `npm install --package-lock-only` angeglichen.
  - `.github/workflows/ci.yml` mit dem Job `tests`, ausgelöst bei jedem Push und Pull Request:
    - Checkout, Node aus `.nvmrc` (mit npm-Cache), `npm ci`, `npm test`.
    - Nur Leserechte (`contents: read`), kein Deploy-Schritt.
  - Lokal geprüft:
    - `npm ci && npm test` ergab 36 von 36 Tests bestanden.
    - Gegenprobe: Ein absichtlich fehlschlagender Test im Scratchpad (nicht im Projekt) lässt `npm test` mit Exit-Code 1 scheitern. Ein roter Test macht die CI also rot.
  - In GitHub Actions geprüft: Der Lauf zum Code-Commit war nach 14 s grün, mit Node 24.21.0 und 36 von 36 Tests bestanden.
  - Abschnitt 1 (Werkzeuge) und Abschnitt 2 (Starten, CI) aktualisiert.
- **Geänderte/neue Dateien:** `.nvmrc`, `.github/workflows/ci.yml`, `package.json`, `package-lock.json`, `DOKUMENTATION.md`
- **Genutzte Tools:** Claude Code, Node.js/npm, Git, GitHub Actions, GitHub CLI (`gh`)
- **Probleme & Lösungen:** Der Code-Commit wurde vor dem Doku-Eintrag gepusht, damit das Ergebnis aus GitHub Actions im Eintrag stehen kann. Beide Commits liegen auf dem Branch `ap1-ci`.
- **Ergebnis:** Jeder Push und jeder Pull Request wird automatisch mit denselben Befehlen wie lokal geprüft. Es wird nichts veröffentlicht. Der Pull Request nach `main` ist vorbereitet und wartet auf die Freigabe der Nutzerin.
- **Bezug zur Planung:** 2026-10-22, 13:13 – Planung: Mehrspieler-Grundlage mit Supabase
- **Abweichungen vom Plan:** keine
- **Git-Commit:** `ce59ecc`

### 2026-10-22, 13:38 – AP 2: Raumdaten öffentlich/geheim und Rätseltyp-Register
- **Auslöser:** Anweisung des Nutzers: „Freigabe für AP hiermit erteilt. OK.“ Claude hat das als Freigabe für den Merge von PR #1 (mit Merge-Commit) und für den Start von AP 2 verstanden. AP 2 laut Plan: Umbau ohne Verhaltensänderung, mit Trennung in öffentliche und geheime Raumdaten, Raumversion, Rätseltyp-Register, Aktion `loese` und Tipp-Nummer.
- **Durchgeführte Schritte:**
  - PR #1 (AP 1) mit Merge-Commit `d35c73f` nach `main` übernommen und den Branch `ap2-raumdaten` von `main` angelegt.
  - **Raumdaten getrennt:**
    - Lösungen (`loesungen.tuer: "417"`) und Tipp-Texte stehen jetzt in `shared/raeume/arbeitszimmer.geheim.js`.
    - Die öffentliche Datei enthält stattdessen `anzahlTipps: 3` und beim Rätsel `stellen: 3`.
    - Dabei fiel auf, dass die Anzeige die Zahl der Rädchen bisher aus der Länge des Lösungscodes gelesen hat. Das ist jetzt behoben.
  - **Raumversion:** `version: 1` in der öffentlichen Raumdatei. Sie wird erhöht, wenn sich Rätsel oder Lösungen ändern.
  - **Zusammensetzen:** `shared/raeume/geheim.js` mit `geheimnisseVon(raumId)` und `mitGeheimnissen(raum)`. Die Spiellogik bekommt den vollständigen Raum mit dem Feld `geheim`.
  - **Rätseltyp-Register:**
    - Neu: `shared/raetsel/index.js` und `shared/raetsel/zahlenschloss.js` mit `pruefe(eingabe, loesung)`.
    - Aus `schloesser` werden `raetsel` mit `typ: "zahlenschloss"`, die Objektaktion heißt jetzt `{ typ: "raetsel", raetsel: "tuer" }`.
    - Die Spiellogik prüft über das Register mit der neuen Aktion `{ typ: "loese", raetsel, eingabe }`.
    - Im Spielstand heißt `geoeffneteSchloesser` jetzt `geloesteRaetsel`.
  - **Tipps:**
    - Die Aktion lautet jetzt `{ typ: "tipp", nummer }`. Es zählt nur der nächste noch nicht geholte Tipp, gleichzeitige Anfragen für denselben Tipp ergeben also nur eine Strafe.
    - Der Spielstand enthält die freigegebenen Tipp-Texte (`freigegebeneTipps`) statt eines Zählers (`genutzteTipps`), und die Hilfe zeigt die Texte aus dem Spielstand.
  - **Anzeige:**
    - `main.js` ordnet Rätseltypen ihrer Anzeige zu (`zahlenschloss` → `zeigeSchloss`) und sendet die Tipp-Nummer.
    - `verbindung-lokal.js` setzt den Raum vorübergehend mit den Geheimnissen zusammen.
    - `neustart` bleibt bis AP 4 lokal erhalten.
  - **Tests:** 36 → 47, alle bestanden. Neu bzw. angepasst:
    - keine Lösungen und Tipp-Texte in öffentlichen Raumdateien
    - gültige Raumversion
    - bekannter Rätseltyp und vorhandene Lösung je Rätsel, Ausgang ist ein Rätsel
    - Rätsel-Aktionen verweisen auf vorhandene Rätsel
    - Rädchen-Anzahl passt zur Lösung
    - `anzahlTipps` passt zu den Tipp-Texten
    - Rätseltyp-Modul (`test/raetsel.test.js`)
    - unbekannter Rätseltyp
    - gleichzeitiger Tipp mit derselben Nummer, Tipp mit falscher Nummer
    - Den Test für den doppelten Start gab es schon.
  - **Sichtprüfung** mit Chrome headless (Skript nur im Scratchpad):
    - Intro, Timer 10:00
    - Tipp 1 erscheint mit Text, Timer 09:00, Knopf „Tipp 2 von 3“
    - Schloss mit 3 Rädchen, falscher Code meldet „Das Schloss rührt sich nicht.“, 4-1-7 ergibt „Geschafft!“
    - „Nochmal spielen“ setzt die Tipps zurück
    - keine JS-Fehler
  - `docs/anleitung.md` (Neuen Raum anlegen) und Abschnitt 2 aktualisiert.
  - CI auf dem Branch: grün (Node 24.21.0, 47 von 47 Tests).
- **Geänderte/neue Dateien:** `shared/raeume/arbeitszimmer.js`, `shared/raeume/arbeitszimmer.geheim.js`, `shared/raeume/geheim.js`, `shared/raetsel/index.js`, `shared/raetsel/zahlenschloss.js`, `shared/spiel-logik.js`, `public/js/main.js`, `public/js/anzeige.js`, `public/js/verbindung-lokal.js`, `test/spiel-logik.test.js`, `test/raeume.test.js`, `test/raetsel.test.js`, `docs/anleitung.md`, `DOKUMENTATION.md`
- **Genutzte Tools:** Claude Code, Node.js (`node:test`), Google Chrome (headless, DevTools-Protokoll), Git, GitHub Actions, GitHub CLI (`gh`)
- **Probleme & Lösungen:**
  - Die Rädchen-Anzahl hing an der geheimen Lösung → neues öffentliches Feld `stellen`, ein Test prüft, dass es zur Lösung passt.
  - Beim ersten Lauf des Prüfskripts war Chrome noch nicht bereit → Warteschleife im Skript.
- **Ergebnis:** Das Spiel verhält sich wie vorher. Die geheimen Daten sind getrennt und durch Tests abgesichert, und neue Rätseltypen lassen sich ohne Änderung der Spiellogik ergänzen. Die geheimen Dateien gehen noch an den Browser, bis AP 4 die lokale Verbindung ersetzt.
- **Bezug zur Planung:** 2026-10-22, 13:13 – Planung: Mehrspieler-Grundlage mit Supabase
- **Abweichungen vom Plan:**
  - Für das Zahlenschloss gibt es noch kein eigenes Anzeige-Modul. Die vorhandene Funktion `zeigeSchloss` in `anzeige.js` wird über eine Zuordnung in `main.js` angesprochen. Ein eigenes Modul lohnt sich erst mit einem zweiten Rätseltyp.
  - Der Zähler `genutzteTipps` wurde durch die Liste `freigegebeneTipps` ersetzt, statt sie zusätzlich aufzunehmen. So können Zähler und Liste nicht auseinanderlaufen.
- **Git-Commit:** `40ae04e`

### 2026-10-22, 14:09 – Entscheidung: Beitritt nur vor dem Spielstart
- **Auslöser:** Anweisung des Nutzers: „Neue Spieler dürfen nur vor dem Spielstart beitreten, solange die Sitzung den Status ‚bereit‘ hat. Bereits vorhandene Mitglieder dürfen nach Neuladen oder Verbindungsabbruch wieder einsteigen; der Timer läuft weiter. Bitte dokumentiere diese Entscheidung und berücksichtige sie im Backend einschließlich eines Tests für gleichzeitigen Beitritt und Spielstart.“
- **Durchgeführte Schritte:**
  - Entscheidung in Abschnitt 3 eingetragen, die offene Frage in Abschnitt 2 entfernt.
  - In `docs/ideen.md` als entschieden markiert. Der verworfene Vorschlag „ja, bis zum Spielende“ bleibt dort erkennbar.
  - Die Umsetzung im Backend und der Test für gleichzeitigen Beitritt und Spielstart folgen in AP 3 auf demselben Branch.
- **Geänderte/neue Dateien:** `DOKUMENTATION.md`, `docs/ideen.md`
- **Genutzte Tools:** Claude Code, Git
- **Probleme & Lösungen:** keine
- **Ergebnis:** Die letzte vor AP 3 offene Frage ist geklärt.
- **Bezug zur Planung:** 2026-10-22, 13:13 – Planung: Mehrspieler-Grundlage mit Supabase (offene Entscheidung „Beitritt zu laufenden Sitzungen“)
- **Abweichungen vom Plan:** keine
- **Git-Commit:** keiner (keine Code-Änderung)

### 2026-10-22, 15:00 – AP 3: Supabase-Backend für Sitzungen (lokal)
- **Auslöser:** Anweisung des Nutzers: „Du bekommst hiermit die Freigabe. Ich werde parallel Docker herunterladen und einrichten.“ Dazu kam die Entscheidung zum Beitritt (siehe Eintrag 14:09) mit dem Auftrag, sie im Backend zu berücksichtigen, „einschließlich eines Tests für gleichzeitigen Beitritt und Spielstart“. Vorher wurde PR #2 (AP 2) mit Merge-Commit `97c5e0f` nach `main` übernommen und der Branch `ap3-backend` angelegt.
- **Durchgeführte Schritte:**
  - **Werkzeuge:**
    - Supabase CLI 2.120.0 und supabase-js 2.117.3 als Entwicklungsabhängigkeiten mit festen Versionen, bewusst nicht die neuesten, sondern etwa zwei Wochen alte.
    - `supabase init`: Projekt-ID `escape-room`, Gastanmeldung an, für die lokalen Tests höheres Limit für Gastanmeldungen.
  - **Migration** `supabase/migrations/20261022141522_sitzungen.sql`:
    - Tabellen `sitzungen` (Spielstand als `jsonb`, `version`, `raum_id`, `raum_version`, Beitrittscode), `sitzung_mitglieder` und `aktionen`.
    - RLS: Mitglieder lesen nur ihre Sitzung und deren Mitglieder. Schreibrechte für Browser sind entzogen, `aktionen` ist für Browser gesperrt. Hilfsfunktion `ist_mitglied`.
    - Realtime-Freigabe für `sitzungen` und `sitzung_mitglieder`.
    - Datenbankfunktionen, jeweils eine Transaktion und nur für `service_role` ausführbar:
      - `erstelle_sitzung`: Code aus 6 Zeichen ohne verwechselbare Zeichen.
      - `tritt_bei`: Zeilensperre, neue Mitglieder nur im Status „bereit“ und höchstens 4, bestehende Mitglieder jederzeit.
      - `speichere_aktion`: Aktion und Spielstand gemeinsam, mit Versionsprüfung und Erkennung doppelter `aktion_id`.
      - `speichere_zustand`: für den Zeitablauf.
  - **Edge Functions** (JavaScript, `@supabase/server` 1.9.1):
    - `sitzung-erstellen`, `sitzung-beitreten` (per Code), `sitzung-laden` (nur Mitglieder) und `aktion`.
    - Gemeinsamer Kern `_shared/kern.js`: Aktionen prüfen und bereinigen, „start“ nur durch die erstellende Person, Raumversion prüfen, Zeitablauf mit der Serverzeit, `neustart` online nicht erlaubt.
    - Hilfsfunktionen in `_shared/sitzungen.js`. Laden und Beitreten erkennen den Zeitablauf und speichern ihn.
  - **Tests:**
    - `npm test` jetzt mit festem Muster `test/**/*.test.js`: 57 Unit-Tests, davon 10 neue für den Backend-Kern.
    - `npm run test:backend` mit 22 Backend-Tests in `test-backend/`:
      - **Sitzungsregeln:** Erstellen, Beitritt per Code, Laden nur als Mitglied, Start nur durch die erstellende Person, Tipps durch alle, Abweisung nach dem Start, Wiedereinstieg mit weiterlaufender Zeit, höchstens vier Personen, Zeitablauf beim Laden, veraltete Raumversion, doppelte `aktion_id`, Sieg ohne Lösung in der Antwort.
      - **Gleichzeitigkeit:** paralleler Tipp, vier parallele verschiedene Aktionen, doppelte Aktion parallel, fünf parallele Beitritte, **gleichzeitiger Beitritt und Spielstart** (12 Runden mit versetztem Beitritt; geprüft wird auf die Mikrosekunde, dass jeder erfolgreiche Beitritt vor dem Start gespeichert wurde).
      - **Sicherheit:** schreibende Datenbankfunktionen aus dem Browser gesperrt, Tabellen für Browser nicht beschreibbar, Fremde sehen nichts, Versionskonflikt schreibt nichts, gescheiterter Aktionseintrag nimmt auch die Spielstandänderung zurück, Realtime nur für Mitglieder.
    - Alle Backend-Tests laufen nur gegen das lokale Supabase, die Hilfsdatei bricht bei einer anderen Adresse ab.
  - **CI:** zweiter Job `backend`. Er startet auf dem GitHub-Rechner ein frisches Supabase (`npm run backend:start`), führt `npm run test:backend` aus, zeigt bei Fehlern die Protokolle und räumt am Ende auf.
  - `docs/anleitung.md` um „Backend lokal“ ergänzt, Abschnitte 1 bis 3 aktualisiert. In Abschnitt 1 und 2 stand CI noch als geplant, das ist korrigiert.
- **Geänderte/neue Dateien:** `package.json`, `package-lock.json`, `.github/workflows/ci.yml`, `supabase/config.toml`, `supabase/.gitignore`, `supabase/migrations/20261022141522_sitzungen.sql`, `supabase/functions/_shared/kern.js`, `supabase/functions/_shared/sitzungen.js`, `supabase/functions/{sitzung-erstellen,sitzung-beitreten,sitzung-laden,aktion}/index.js` und `deno.json`, `test/kern.test.js`, `test-backend/hilfe.js`, `test-backend/sitzungen.test.js`, `test-backend/gleichzeitigkeit.test.js`, `test-backend/sicherheit.test.js`, `docs/anleitung.md`, `DOKUMENTATION.md`
- **Genutzte Tools:** Claude Code, Node.js (`node:test`), Supabase CLI, Docker Desktop (bei der Nutzerin eingerichtet), Git, GitHub Actions, GitHub CLI (`gh`)
- **Probleme & Lösungen:**
  - **Docker fehlte zu Beginn lokal.** Die Backend-Tests liefen deshalb zuerst nur in der CI, der erste Commit ist als „noch ungeprüft“ gekennzeichnet. Später lief Docker Desktop bei der Nutzerin, der Befehl `docker` war aber nicht im Suchpfad. Claude hat ihn für die eigenen Befehle ergänzt, die Anleitung beschreibt die Einstellung.
  - **CI-Lauf 1: vier gleichzeitige Aktionen.** Eine scheiterte nach 3 Versuchen mit „zu viele gleichzeitige Änderungen“. Überschrieben wurde nichts, die Aktion ging aber verloren → bis zu 8 Versuche mit kurzer Zufallspause.
  - **CI-Lauf 1: Test „Beitritt und Start gleichzeitig“.** Der Beitritt gewann immer, der Test prüfte also nur eine Reihenfolge → Beitritt je Runde etwas versetzt.
  - **Realtime: Mitglieder empfingen nichts** (CI-Läufe 1 bis 3).
    - Diagnose:
      - Das Abonnement war bestätigt, Publikation und Rechte stimmten.
      - Lokal empfing das Backend die Änderungen, das Mitglied nicht.
      - Mit einem offenen Abonnement im Diagnoseskript empfing auch das Mitglied.
    - Ursache: `SUBSCRIBED` kommt vor der Freischaltung der Datenbankänderungen. Die meldet Realtime erst mit „Subscribed to PostgreSQL“, und die Aktionen im Test liefen schon vorher.
    - Lösung: Der Test wartet auf diese Systemnachricht. Für AP 4 ist das als Entscheidung festgehalten.
  - **Test „Beitritt und Start gleichzeitig“ schlug lokal gelegentlich fehl.**
    - Diagnose: Die Datenbank bestätigte, dass alle Beitritte vor dem Start gespeichert waren, oft aber in derselben Millisekunde. JavaScripts `Date` vergleicht nur Millisekunden.
    - Lösung: Vergleich auf die Mikrosekunde genau. Danach liefen die Tests lokal 5-mal hintereinander grün.
- **Ergebnis:**
  - Das Backend für Sitzungen läuft lokal und in der CI: CI-Lauf zu `d96d2b0` grün mit 57 Unit-Tests und 22 Backend-Tests. Im Test zu Beitritt und Start kamen beide Reihenfolgen vor (4 Beitritte, 8 Abweisungen).
  - Das Cloud-Projekt wurde nicht angefasst, der Browser nutzt das Backend noch nicht (AP 4).
- **Bezug zur Planung:** 2026-10-22, 13:13 – Planung: Mehrspieler-Grundlage mit Supabase
- **Abweichungen vom Plan:**
  - Versionskonflikte meldet `speichere_aktion` als Ergebnis statt als Fehler. Es wurde dann noch nichts geschrieben, also muss nichts zurückgenommen werden. Dass ein gescheiterter Aktionseintrag die Spielstandänderung zurücknimmt, prüft ein eigener Test.
  - 8 statt 3 Versuche bei Versionskonflikten (siehe Probleme).
  - Die Edge Functions nutzen `@supabase/server` aus der aktuellen CLI-Vorlage. Das stand nicht im Plan, ändert aber nichts an der Aufgabenverteilung.
  - Die Hilfsfunktion `ist_mitglied` darf die Rolle `authenticated` ausführen, das ist für die Zugriffsregeln nötig. Sie verrät nur die eigene Mitgliedschaft.
  - Die Backend-Tests liefen zuerst nur in der CI, weil lokal noch kein Docker eingerichtet war.
- **Git-Commit:** `918df50` (Backend, noch ungeprüft), `8cafe8e` (mehr Versuche, Diagnose), `9756cac` (Diagnose), `d96d2b0` (Realtime-Bereitschaft, Zeitvergleich)

### 2026-10-22, 20:58 – Entscheidung: Verlassen durch die erstellende Person beendet die Sitzung
- **Auslöser:** Anweisung des Nutzers: „Wenn die erstellende Person die Sitzung bewusst verlässt, wird die Sitzung für alle beendet – sowohl vor dem Start als auch während des Spiels. Die übrigen Mitglieder erhalten eine entsprechende Meldung. Es gibt keine Übergabe der Startberechtigung. Ein Neuladen oder kurzer Verbindungsabbruch soll nicht als bewusstes Verlassen gelten. Bitte halte die Umsetzung möglichst einfach und dokumentiere diese Regel.“ In derselben Nachricht kamen die Freigabe von PR #3 und AP 4 sowie die Bitte, `docker info` zu prüfen.
- **Durchgeführte Schritte:**
  - `docker info` geprüft: Docker ist jetzt im Terminal erreichbar (Server 29.9.2, Docker Desktop). Die Supabase CLI startet ohne weitere Einstellungen.
  - PR #3 (AP 3) mit Merge-Commit `6c177cb` nach `main` übernommen und den Branch `ap4-online-spiel` angelegt.
  - Regel in Abschnitt 3 eingetragen, die offene Frage in Abschnitt 2 entfernt, in `docs/ideen.md` als entschieden markiert.
  - Die Umsetzung folgt in AP 4 auf demselben Branch: Nur ein ausdrücklicher Klick auf „Verlassen“ durch die erstellende Person beendet die Sitzung, es gibt keine Erkennung von Verbindungsabbrüchen.
- **Geänderte/neue Dateien:** `DOKUMENTATION.md`, `docs/ideen.md`
- **Genutzte Tools:** Claude Code, Docker, Git, GitHub CLI (`gh`)
- **Probleme & Lösungen:** keine
- **Ergebnis:** Alle für AP 4 offenen Fragen sind geklärt.
- **Bezug zur Planung:** 2026-10-22, 13:13 – Planung: Mehrspieler-Grundlage mit Supabase (offene Entscheidung „erstellende Person verlässt die Sitzung“)
- **Abweichungen vom Plan:** keine
- **Git-Commit:** keiner (keine Code-Änderung)

### 2026-10-22, 21:29 – AP 4: Online-Spiel mit Sitzungen im Browser (Meilenstein 1 lokal)
- **Auslöser:** Anweisung des Nutzers: „Hiermit gebe ich PR #3 zum Zusammenführen mit Merge-Commit und anschließend AP4 zur Umsetzung frei.“ Dazu kam die Regel zum Verlassen durch die erstellende Person (siehe Eintrag 20:58) mit der Bitte, die Umsetzung möglichst einfach zu halten.
- **Durchgeführte Schritte:**
  - **Umzug:**
    - `shared/` wurde zu `public/shared/` und enthält nur Öffentliches, die Browserpfade `/shared/…` bleiben gleich.
    - Lösungen und Tipp-Texte (`arbeitszimmer.geheim.js`, `geheim.js`) liegen jetzt unter `supabase/functions/_shared/raeume/`.
    - `public/js/verbindung-lokal.js` und die Aktion `neustart` sind entfernt.
    - `server.js` liefert nur noch `public/` aus.
  - **Backend:**
    - Neue Aktion `verlassen`: nur die erstellende Person, setzt den Status `beendet` und hält die Zeit an.
    - `restzeit` behandelt Spiele ohne Startzeit einheitlich (volle Zeit).
  - **`public/js/verbindung-online.js`:**
    - Gastanmeldung, wird einmal pro Seitenaufruf beim Server geprüft und bei Bedarf erneuert.
    - `erstelleSitzung`, `trittBei`, `verbindeMitSitzung` mit `sendeAktion` und `beiAenderung` (dieselbe Schnittstelle wie die alte lokale Verbindung), dazu `beiMitgliedern`.
    - Übernommen wird nur ein Stand mit höherer Version.
    - Realtime-Abonnement auf die eigene Sitzung und neue Mitglieder. Abgleich über `sitzung-laden`, sobald „Subscribed to PostgreSQL“ eintrifft, also auch nach jedem automatischen Wiederverbinden, außerdem bei `online` und wenn der Tab wieder sichtbar wird.
    - Restzeit nach der Serveruhr. Bei 0 fragt der Browser beim Backend nach, die Entscheidung trifft der Server.
    - Aktionen mit eigener `aktionId`, bei Netzfehlern bis zu zweimal mit derselben ID wiederholt.
  - **`public/js/supabase-konfig.js`:** lokal die Standardwerte der Supabase CLI, die Cloud-Werte folgen in AP 5.
  - **Startseite:**
    - „Spielen“ erstellt eine Sitzung.
    - Code-Feld zum Beitreten, mit Meldungen für unbekannten Code, schon gestartete oder volle Sitzung, fehlenden Zugriff und Verbindungsprobleme.
  - **Spielseite:**
    - Kopfleiste mit Code und Mitspielenden. Im Intro erscheinen Code und Mitspielende, für andere Mitglieder ein Wartehinweis statt „Raum betreten“.
    - „Verlassen“ in Kopfleiste und Intro, für die erstellende Person mit Nachfrage „Wenn du die Sitzung verlässt, ist sie für alle beendet. Wirklich verlassen?“.
    - Ende-Bildschirm „Sitzung beendet“. „Nochmal spielen“ erstellt eine neue Sitzung.
    - Neue Elemente sind in die Einblend-Animation des Intros eingereiht.
  - **Tests:**
    - Unit: 64. Neu: kein Neustart, beendetes Spiel, Verlassen (5 Tests), **keine Datei in `public/` enthält Lösungen oder Tipp-Texte**.
    - Backend: 24. Neu: Verlassen vor dem Start und während des Spiels, andere können nicht beenden, kein Beitritt zu beendeten Sitzungen.
  - **Meilenstein 1 lokal:** Prüfskript mit drei getrennten Chrome-Instanzen (A, B, C mit eigenem Profil, also eigenem Gast), nur im Scratchpad. **23 von 23 Prüfungen bestanden:**
    - A erstellt eine Sitzung, B tritt per Code bei und kann nicht starten (Wartehinweis), A sieht „2/4“.
    - A startet, das Intro schließt sich bei B, beide Timer laufen.
    - C erstellt eine eigene Sitzung. Öffnet C die Adresse der Sitzung von A, kommt der Hinweis „kein Mitglied“.
    - B findet eine Spur, sie erscheint bei A, nicht bei C.
    - A und B fordern gleichzeitig einen Tipp an: in der Datenbank genau 1 Tipp und 60 s Strafe.
    - B lädt neu: dieselbe Restzeit wie A (08:50 / 08:50), Spur und Tipp sind noch da.
    - C startet und schließt die Seite, die Zeit wird in der Datenbank vorgespult. Beim Öffnen stellt der Server „verloren“ fest und speichert es.
    - A verlässt die Sitzung (mit Nachfrage), B sieht „Sitzung beendet“.
    - Keine JS-Fehler.
  - **Weitere Prüfungen:**
    - Der Server liefert `/shared/raeume/arbeitszimmer.js` ohne Lösung und Tipps aus. `/shared/raeume/geheim.js`, `/shared/raeume/arbeitszimmer.geheim.js` und `/js/verbindung-lokal.js` ergeben 404.
    - Screenshots von Intro (Desktop und Handy quer), laufendem Spiel, „kein Zugriff“ und „Sitzung beendet“.
  - `docs/anleitung.md` aktualisiert: Online spielen lokal, Neustart des Backends nach Änderungen an geteilten Dateien, neue Pfade beim Anlegen eines Raums. Abschnitte 1 bis 3 aktualisiert.
  - CI auf dem Branch: grün (64 Unit-Tests, 24 Backend-Tests).
- **Geänderte/neue Dateien:** `public/js/verbindung-online.js`, `public/js/supabase-konfig.js`, `public/js/main.js`, `public/js/start.js`, `public/js/anzeige.js`, `public/index.html`, `public/spiel.html`, `public/css/style.css`, `public/shared/**` (verschoben aus `shared/`), `supabase/functions/_shared/raeume/arbeitszimmer.geheim.js` und `geheim.js` (verschoben), `supabase/functions/_shared/kern.js`, `supabase/functions/aktion/index.js`, `server.js`, entfernt: `public/js/verbindung-lokal.js`; Tests: `test/spiel-logik.test.js`, `test/raeume.test.js`, `test/raetsel.test.js`, `test/kern.test.js`, `test-backend/sitzungen.test.js`; `docs/anleitung.md`, `DOKUMENTATION.md`
- **Genutzte Tools:** Claude Code, Node.js (`node:test`), Supabase CLI, Docker Desktop, Google Chrome (headless, DevTools-Protokoll, drei Instanzen), curl, Git, GitHub Actions, GitHub CLI (`gh`)
- **Probleme & Lösungen:**
  - **Edge Functions starteten nach dem Umzug nicht mehr** („Module not found“). Die Supabase CLI bindet Dateien von außerhalb von `supabase/` beim Start in den Container ein. Nach dem Verschieben bzw. Ersetzen einer Datei (z. B. durch `sed -i`) zeigte die Einbindung ins Leere → Backend neu gestartet, Hinweis in die Anleitung aufgenommen.
  - **Startseite meldete „interner Fehler“.** Ein Browserprofil hatte noch eine Gastanmeldung von vor dem Datenbank-Reset, und den Nutzer gab es nicht mehr (Fremdschlüssel-Fehler). Das kann auch real vorkommen → Die Anmeldung wird beim Server geprüft und bei Bedarf erneuert.
  - **Fehler im Prüfskript:**
    - Der Platzhalter „······“ im Code-Feld hat auch 6 Zeichen und wurde für den Code gehalten. Das Skript wartet jetzt auf einen gültigen Code.
    - Beim Neuladen hat das Skript zu früh abgefragt.
    - Alte Chrome-Prozesse blockierten Profile.
    - Keiner dieser Fehler lag in der App.
  - **Intro:** Die neuen Zeilen erschienen vor der eingeblendeten Geschichte → in die Einblend-Animation aufgenommen.
  - **Der neue Test fand eine echte Lücke:** Im Kommentar von `public/shared/raetsel/zahlenschloss.js` stand die echte Lösung „417“ als Beispiel → durch „123“ ersetzt.
- **Ergebnis:**
  - Das Spiel läuft lokal vollständig online. Zwei Personen lösen das Arbeitszimmer gemeinsam, eine dritte spielt gleichzeitig unabhängig. Gleichzeitige Tipps zählen einmal, Neuladen stellt den Stand wieder her, und den Zeitablauf erkennt der Server.
  - Lösungen und Tipps erreichen den Browser nicht mehr.
  - Die Regel zum Verlassen ist umgesetzt.
  - **Meilenstein 1 ist lokal erreicht**, der Nachweis auf echten Geräten folgt in AP 5.
- **Bezug zur Planung:** 2026-10-22, 13:13 – Planung: Mehrspieler-Grundlage mit Supabase
- **Abweichungen vom Plan:**
  - Zusätzlich die Aktion `verlassen` und der Status `beendet`, nach der Entscheidung vom 2026-10-22 (20:58).
  - Für die Mitgliederanzeige wird zusätzlich `sitzung_mitglieder` per Realtime abonniert und gezählt. Das war im Plan als Möglichkeit genannt.
  - Die Gastanmeldung wird beim Server geprüft und erneuert. Das stand nicht im Plan, ist aber nötig (siehe Probleme).
  - Der Meilenstein-1-Test „Zeitablauf, während alle Fenster zu sind“ spult die Startzeit in der Datenbank vor, statt 10 Minuten zu warten.
- **Git-Commit:** `e0ac7e8`
