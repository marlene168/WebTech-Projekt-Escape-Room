# Plan: Mehrspieler-Grundlage mit Supabase und drei Räume

> **Aktualisiert am 2026-10-23:** AP 5 ist durch den Detailplan [`2026-10-23_ap5-testumgebung.md`](2026-10-23_ap5-testumgebung.md) konkretisiert (geschützte Testversion, Deployment per Knopf). Wo er abweicht, gilt der Detailplan. Überholte Angaben unten sind mit „(aktualisiert 2026-10-23: …)“ markiert.

## Kontext
Der aktuelle Stand ist ein Einzelspieler-Prototyp:
- Spielstand und Timer liegen nur im Browser (`public/js/verbindung-lokal.js`).
- Lösungen und Tipps sind öffentlich abrufbar (`shared/raeume/arbeitszimmer.js`, ausgeliefert unter `/shared` durch `server.js`).
- Raumvorlage und Spielsitzung sind nicht getrennt.

Ziel dieser Phase: gemeinsame und gleichzeitig unabhängige Sitzungen über Vercel und Supabase, danach insgesamt drei eigenständige Räume. Rangliste und endgültige Gestaltung gehören nicht zu dieser Phase.

Ausgangslage (geprüft am 2026-10-22):
- Kein `.github/`, es gibt also keine Workflows.
- Nur der Branch `main`.
- Keine Docker-kompatible Laufzeit installiert.
- GitHub CLI `gh` angemeldet.
- Node v24 lokal.
- Supabase ist noch nicht eingerichtet.

Legende: **[A]** Anforderung (von dir festgelegt) · **[V]** technischer Vorschlag von Claude · **[O]** offene Entscheidung

## Anforderungen [A]
- **Umfang und Plattform**
  - Drei eigenständige Räume. Mehrspieler hat Vorrang.
  - Gemeinsame Sitzungen. Dieselbe Raumvorlage ist gleichzeitig in unabhängigen Sitzungen spielbar.
  - Vercel und Supabase. Das Frontend bleibt bei HTML, CSS und JavaScript.
- **Backend entscheidet**
  - Das Backend entscheidet über den Spielstand. Der Browser sendet Aktionsversuche und bekommt keine Geheimnisse.
  - Das Backend erkennt den Zeitablauf selbst: beim Laden, beim Wiederbeitritt und bei Aktionen. Es verlässt sich nicht auf eine Meldung des Browsers.
- **Sicher bei Gleichzeitigkeit**
  - Aktionseintrag und Spielstandänderung gelingen gemeinsam oder werden vollständig zurückgenommen.
  - Gruppengrenze und Beitritte sind gegen gleichzeitige Zugriffe abgesichert.
  - Doppelt gesendete Aktionen wirken nur einmal.
  - Nach Neuladen oder Abbruch wird der Stand wiederhergestellt.
- **Anmeldung und Spielregeln** (entschieden am 2026-10-22)
  - Für Meilenstein 1 Gastzugang (anonyme Anmeldung bei Supabase).
  - Gespielt wird nur online. Ein Einzelspiel ist eine Sitzung mit einer Person. Ein lokales Backend während der Entwicklung widerspricht dem nicht.
  - Neue Mitglieder treten **per Beitrittscode** bei. **Laden per Sitzungs-ID nur für bestehende Mitglieder.**
  - **Nur die erstellende Person startet.** **Höchstens vier Personen.** **Alle Mitglieder dürfen Tipps anfordern.**
  - **Erneutes Spielen erzeugt eine neue Sitzung.** Es gibt keinen Neustart innerhalb einer Sitzung, die bisher geplante „Runde“ entfällt.
  - Zusätzlich zur Raum-ID wird eine **Raumversion** gespeichert.
- **CI und Arbeitsweise**
  - CI wird von Claude eingerichtet: feste Node-Version, `npm ci`, die vorhandenen Tests. Mit dem Backend kommen Integrationsprüfungen dazu.
  - Neue Tests entstehen zusammen mit neuen Funktionen, die Pipeline erzeugt keine Tests.
  - Lokal und in der CI gelten dieselben Testbefehle.
  - Es gibt kein automatisches Deployment.
  - Die CI baut eine frische, temporäre Supabase-Umgebung auf und verändert nie das Cloud-Projekt.
  - Arbeitspakete laufen nacheinander auf eigenen Branches. Code, Tests und Doku liegen auf demselben Branch. Nach erfolgreichen Prüfungen folgt ein Pull Request, zusammengeführt wird erst nach deiner Freigabe.

## 1. Supabase lokal und in der Cloud
- [V] **Lokal (Entwicklung und CI):**
  - Die Supabase CLI wird als **npm-Entwicklungsabhängigkeit** mit fester Version eingebunden. `npx supabase …` nutzt dann lokal und in der CI dieselbe Version, ohne Homebrew.
  - `supabase start` startet den ganzen Stack in Docker (Datenbank, Auth, Realtime, Edge Functions).
  - `supabase db reset` baut die Datenbank frisch aus den Migrationen.
  - `supabase functions serve` startet die Edge Functions.
- [V] **Cloud-Projekt**: nur für gemeinsame Gerätetests und den späteren Betrieb. Migrationen und Funktionen kommen erst in Arbeitspaket 5 dorthin, und nur nach deinem OK. *(aktualisiert 2026-10-23: zunächst nur ein **Test-Projekt** `escape-room-test`; das öffentliche Projekt wird erst nach ausdrücklicher Freigabe angelegt.)*
- [V] `public/js/supabase-konfig.js` wählt anhand der Adresse: unter `localhost` das lokale Backend, sonst das Cloud-Projekt. Die lokalen Schlüssel sind Standardwerte für die Entwicklung, der Publishable Key der Cloud ist öffentlich. Den Secret Key gibst du nie weiter.
- **Was du selbst tust, erkläre ich jeweils zu Beginn des passenden Arbeitspakets konkret:**
  - AP 3: eine Docker-kompatible Laufzeit installieren. Empfehlung: Docker Desktop (kostenlos für Studium und private Nutzung), Alternativen sind OrbStack oder Colima.
  - AP 5: Supabase-Konto und -Projekt anlegen, Gastanmeldung einschalten, URL und Publishable Key weitergeben, Vercel-Konto anlegen und mit dem Repo verbinden. *(aktualisiert 2026-10-23: zunächst nur das **Test-Projekt**; Vercel-Projekt **ohne Git-Verbindung**, Deployment nur per CLI aus dem Workflow; dazu Cloudflare Turnstile und Repository-Secrets – siehe Detailplan, Abschnitt 5.)*

## 2. Datenmodell (kritisch geprüft)
Bisheriger Vorschlag: Sitzung mit ID, Beitrittscode, Mitgliedern und eigenem verbindlichem Spielstand sowie verarbeitete Aktionen.

**Was am Code auffällt:**
- Der Spielstand ist schon heute ein kleines JSON-Objekt (`erstelleSpielstand` in `shared/spiel-logik.js`).
- Drei Räume mit unterschiedlichen Rätseltypen haben unterschiedliche Fortschrittsdaten.

Daraus folgt [V]:
- **Spielstand als ein `jsonb`-Dokument pro Sitzung mit Versionsnummer**, nicht verteilt auf viele Tabellen. Das Backend bleibt so für alle Räume gleich, und die bestehende Logik arbeitet unverändert mit diesem Objekt.
- **Raumvorlagen bleiben im Code**, versioniert in Git und durch Tests abgesichert. Die Datenbank speichert `raum_id` und `raum_version`.
- **Aktionen-Tabelle gegen Doppelverarbeitung** (und zur Nachvollziehbarkeit). Der Spielstand wird nicht aus ihr neu berechnet (kein Event-Sourcing).

| Tabelle | Felder (Entwurf, noch nicht endgültig) |
|---|---|
| `sitzungen` | `id` (uuid), `raum_id`, `raum_version`, `beitrittscode` (6 Zeichen ohne verwechselbare Zeichen, eindeutig), `erstellt_von`, `zustand` (jsonb), `version` (int), `erstellt_am`, `aktualisiert_am` |
| `sitzung_mitglieder` | `sitzung_id`, `user_id`, `beigetreten_am`; Primärschlüssel aus beiden |
| `aktionen` | `sitzung_id`, `aktion_id` (uuid, vom Browser erzeugt), `user_id`, `typ`, `daten` (jsonb), `erstellt_am`; eindeutig (`sitzung_id`, `aktion_id`) |

- [V] **Raumversion**: Jede Raumdatei bekommt ein Feld `version` (eine Zahl). Sie wird erhöht, wenn sich Rätsel oder Lösungen ändern. Eine Sitzung mit veralteter Version nimmt keine Aktionen mehr an und meldet „Raum wurde aktualisiert, bitte neu spielen“. So wird nie mit falscher Lösung gerechnet.
- [V] Spielstand: Freigegebene Tipp-Texte kommen hinzu. Die Aktion `neustart` entfällt („Nochmal spielen“ erzeugt eine neue Sitzung). Die aktuelle Szene bleibt pro Gerät.

## 3. Öffentlich und geheim trennen, Logik wiederverwenden
- [V] Jeder Raum besteht aus zwei Dateien:
  - **öffentlich**: Szenen, Objekte, Texte, Spuren, Geschichte, Anzahl der Tipps, Rätselbeschreibung ohne Lösung, `version`
  - **geheim**: Lösungen und Tipp-Texte
- [V] Endgültige Ordner (ab AP 4):
  - `shared/` zieht nach `public/shared/` um und enthält nur Öffentliches. Der Browserpfad `/shared/…` bleibt gleich.
  - Geheimes liegt unter `supabase/functions/_shared/raeume/<raum>.geheim.js`.
  - Vercel liefert nur `public/` aus.
- [V] `spiel-logik.js` bleibt eine reine Funktion. Sie bekommt im Backend den zusammengesetzten Raum und die Serverzeit. Wiederverwendet werden `erstelleSpielstand`, `verarbeiteAktion`, `pruefeZeit`, `restzeit` und `findeObjekt`. Der Browser nutzt `restzeit` nur zur Anzeige.
- [V] Die Edge Functions importieren die Logik direkt aus dem Projekt. Ob das lokal mit `functions serve` und beim Cloud-Deploy (`--use-api`) klappt, wird in AP 3 zuerst geprüft. Notlösung: ein Kopierskript mit einem Test, der Gleichheit prüft.
- [V] Ein Test stellt sicher, dass öffentliche Raumdateien keine Lösungen und keine Tipp-Texte enthalten.
- Hinweis: Das GitHub-Repo ist privat, die Geheim-Dateien im Repo sind daher unkritisch.

## 4. Aufgabenverteilung, Berechtigungen, Gleichzeitigkeit, Zeit
- **Edge Functions** [V]: Spielregeln, Anmeldung (JWT), Eingabeprüfung, Serverzeit, Geheimnisse.
  - `sitzung-erstellen` (raumId): neue Sitzung mit Code und aktueller Raumversion; die erstellende Person wird Mitglied.
  - `sitzung-beitreten` (**Beitrittscode**): trägt neue Mitglieder ein. Ist man schon Mitglied, ändert sich nichts. Höchstens vier Personen.
  - `sitzung-laden` (**Sitzungs-ID, nur Mitglieder**): liefert Zustand und Serverzeit und wird beim Neuladen und Wiederverbinden genutzt.
  - `aktion` (sitzungId, aktionId, Aktion): prüft Mitgliedschaft, Rechte („start“ nur die erstellende Person, „tipp“ alle), Eingabe, Raumversion und Zeit. Dann rechnet sie mit der geteilten Logik.
- **Datenbankfunktionen** [V]: Jede läuft als *eine* Transaktion, d. h. sie gelingt ganz oder wird ganz zurückgenommen.
  - `speichere_aktion(sitzung, aktion_id, erwartete_version, neuer_zustand, …)`:
    - trägt die Aktion ein und aktualisiert den Spielstand nur, wenn die Version noch stimmt
    - stimmt die Version nicht, bricht sie mit Fehler ab, und der Aktionseintrag wird zurückgenommen
    - ist die `aktion_id` schon bekannt, meldet sie „schon verarbeitet“ mit dem aktuellen Stand
  - `speichere_zustand(sitzung, erwartete_version, neuer_zustand)`: für vom Server erkannte Änderungen ohne Aktion, z. B. Zeitablauf.
  - `tritt_bei(code, user)`:
    - sperrt die Sitzungszeile (`SELECT … FOR UPDATE`), zählt die Mitglieder und trägt nur ein, wenn weniger als vier dabei sind
    - gleichzeitige Beitritte laufen dadurch nacheinander, ein fünfter kommt nie hinein
  - Hilfsfunktion `ist_mitglied(sitzung)` für die Zugriffsregeln.
- **RLS** (Zugriffsregeln je Zeile) [V]:
  - Mitglieder dürfen ihre Sitzung und deren Mitglieder nur *lesen*, und nur das wird über Realtime empfangen.
  - Schreiben geht ausschließlich über die Edge Functions.
  - `aktionen` ist für Browser gesperrt.
- **Realtime** [V]: „Postgres Changes“ auf die eigene Sitzungszeile und die Mitgliederliste. Die RLS gilt auch hier. Realtime verteilt nur bestätigte Änderungen und enthält keine Spielregeln.
- **Gleichzeitige Aktionen** [V]:
  - Bei einem Versionskonflikt liest die Edge Function neu und rechnet nochmal (höchstens 3 Versuche).
  - **Gleiche `aktion_id`** wird nur einmal verarbeitet.
  - **Zwei Personen klicken gleichzeitig auf „Tipp“**: Die Aktion nennt die Tipp-Nummer, die die Person gesehen hat. Es zählt nur der erste Tipp, also gibt es nur eine Strafe.
  - **„start“** wirkt nur im Status „bereit“, ein doppelter Start ändert nichts.
- **Zeit** [V]:
  - Startzeit und Spielende bestimmt der Server.
  - `sitzung-laden`, `sitzung-beitreten` und `aktion` wenden vor allem anderen `pruefeZeit` mit der Serverzeit an. Ist die Zeit abgelaufen, speichern sie „verloren“, und Realtime verteilt das.
  - Der Browser zeigt die Restzeit mit der Abweichung zur Serverzeit an. Bei 0 ruft er `sitzung-laden` auf, also eine normale Abfrage, keine Ablaufmeldung. Das Ergebnis bestimmt der Server.
- **Wiederverbindung** [V]: Die Sitzungs-ID steht in der Adresse, die Gast-Anmeldung bleibt im Browser gespeichert. Nach Neuladen oder Abbruch: `sitzung-laden` aufrufen und neu abonnieren. Es werden nur Stände mit höherer Version übernommen.
- **„Nochmal spielen“** [A/V]: ruft `sitzung-erstellen` auf und erzeugt eine neue Sitzung mit neuem Code.

## 5. Erweiterbarkeit für Rätseltypen
- [V] **Rätseltyp-Register**: Jeder Typ ist ein kleines Logik-Modul, z. B. `raetsel/zahlenschloss.js` mit `pruefe(eingabe, loesung)`, plus ein Anzeige-Modul.
- [V] Raumdaten beschreiben `raetsel: { tuer: { typ: "zahlenschloss", … } }`, die Lösung steht in der Geheim-Datei. Eine allgemeine Aktion `loese` ersetzt `probiereCode`.
- [V] Gelöste Rätsel können Inhalte freischalten (z. B. `sichtbarWenn`) oder als `ausgang` das Spiel gewinnen.
- Ein neuer Typ braucht also ein Logik-Modul, ein Anzeige-Modul und Raumdaten. **Edge Functions, Tabellen und Regeln bleiben unverändert.** Neue Typen werden erst mit der Planung von Raum 2 bzw. 3 gebaut.

## 6. Tests und CI
- [V] **Testbefehle, lokal und in der CI gleich:**
  - `npm test`: Unit-Tests ohne Backend (Spiellogik, Raumdaten, Rätseltypen, reiner Kern der Edge Functions).
  - `npm run test:backend`: Integrationstests gegen das lokale Supabase.
  - `npm run backend:start` bzw. `backend:stop`: Supabase starten, Datenbank zurücksetzen, Funktionen starten.
- [V] **Workflow `.github/workflows/ci.yml`**, ausgelöst bei Push und Pull Request:
  - Job `tests`: Node-Version aus `.nvmrc` (24), `npm ci`, `npm test`.
  - Job `backend` (ab AP 3): `npm ci`, `npm run backend:start` (frische, temporäre Supabase-Umgebung auf dem GitHub-Runner, gebaut aus den Migrationen), `npm run test:backend`, Aufräumen.
  - Keine Zugangsdaten zum Cloud-Projekt in der CI und kein Deploy-Schritt.
- [V] **Inhalt der Integrationstests:**
  - Migrationen lassen sich frisch anwenden.
  - RLS: Ein Nicht-Mitglied kann nicht lesen und empfängt nichts, ein Browser kann nicht direkt schreiben.
  - Edge Functions: Erstellen, Beitritt per Code, Laden nur als Mitglied, Start nur durch die erstellende Person, Tipps durch alle.
  - Gleichzeitigkeit: parallele Tipps ergeben 1 Strafe, 5 parallele Beitritte ergeben genau 4 Mitglieder.
  - Doppelt gesendete `aktion_id` wirkt einmal.
  - Ein Versionskonflikt nimmt den Aktionseintrag zurück.
  - Zeitablauf wird beim Laden erkannt, getestet mit kurzer Testdauer.
  - Eine veraltete Raumversion wird abgewiesen.
  - Die Tests laufen mit supabase-js in `node:test` (nur ein Test-Werkzeug).

## 7. Branches und Pull Requests
- [V] Pro Arbeitspaket ein Branch von aktuellem `main`, nacheinander. Kleine Änderungen innerhalb eines Pakets bekommen keinen eigenen Branch.
- [V] Ablauf nach CLAUDE.md auf dem Branch: Code-Commit, Doku-Eintrag-Commit, Push des Branches. Am Ende des Pakets Pull Request per `gh pr create`, wenn lokal und in der CI alles grün ist.
- [V] **Zusammenführen nur mit Merge-Commit (kein Squash, kein Rebase).** Sonst stimmen die Commit-Kennungen in `DOKUMENTATION.md` auf `main` nicht mehr.
- [V] Die Planungsdoku (Plandatei und Planungseintrag) kommt als reine Doku direkt auf `main`, bevor AP 1 beginnt.
- Hinweis für Codex: Arbeitet Codex zwischendurch weiter, nutzt es den aktuellen Arbeitsbranch.

## 8. Arbeitspakete
| AP | Branch | Inhalt | Prüfkriterien |
|---|---|---|---|
| 1 | `ap1-ci` | `.nvmrc`, `engines` in `package.json`, Workflow mit Job `tests` | Workflow im PR grün; `npm ci && npm test` lokal identisch; kein Deploy-Schritt |
| 2 | `ap2-raumdaten` | Umbau ohne Verhaltensänderung: Raum öffentlich/geheim (vorerst beide unter `shared/`), `version`, Rätseltyp-Register, Aktion `loese`, Tipp-Nummer; `neustart` bleibt bis AP 4 lokal | `npm test` grün inkl. neuer Tests (keine Lösungen in öffentlichen Dateien, Version vorhanden, paralleler Tipp, doppelter Start); Spiel läuft lokal wie vorher (Screenshots); CI grün |
| 3 | `ap3-backend` | **Vorher deine Schritte:** Docker-Laufzeit installieren. Dann: Supabase CLI als Abhängigkeit, `supabase/config.toml` (Gastanmeldung an), Migrationen (Tabellen, RLS, Datenbankfunktionen, Realtime-Freigabe), Edge Functions mit reinem, unit-getestetem Kern, Integrationstests, CI-Job `backend` | Import der geteilten Logik in den Funktionen bestätigt; alle Integrationstests aus Abschnitt 6 lokal und in der CI grün; das Cloud-Projekt wird nicht angefasst |
| 4 | `ap4-online-spiel` | `verbindung-online.js` (gleiche Funktionen `sendeAktion`/`beiAenderung`), Gast-Anmeldung, Lobby (erstellen, Code teilen, beitreten, Mitspielende), Start nur für die erstellende Person, „Nochmal spielen“ = neue Sitzung; `shared/` → `public/shared/`, Geheimes → `supabase/functions/_shared/`; lokale Verbindung und `neustart` entfernen; `server.js` nur noch als lokaler Entwicklungsserver | **Meilenstein 1 lokal** (siehe unten) gegen das lokale Supabase; `/shared/raeume/arbeitszimmer.js` enthält weder Code noch Tipps; alle Tests und CI grün |
| 5 | `ap5-cloud-vercel` | **Vorher deine Schritte** (erkläre ich dann konkret): Supabase-Projekt, Gastanmeldung, URL und Publishable Key, Vercel-Konto. Dann: Migrationen und Funktionen nach deinem OK in die Cloud, `vercel.json` (Ausgabe `public/`, kein Framework, Git-Deployments aus), Deployment bewusst ausgelöst | **Meilenstein 1 auf echten Geräten** über die öffentliche Adresse; ein Push erzeugt kein Deployment; CI unverändert ohne Cloud-Zugriff. *(aktualisiert 2026-10-23: konkretisiert im Detailplan `2026-10-23_ap5-testumgebung.md`. Meilenstein 1 über die **geschützte Test-Hauptadresse**; Vercel-Projekt **ohne Git-Verbindung**, Deployment nur per CLI aus dem Workflow, `git.deploymentEnabled: false` zusätzlich; die öffentliche Version erst nach ausdrücklicher Freigabe.)* |
| 6 | `ap6-raum-2` | Erst eigene Planung im Plan-Modus (Thema, Geschichte, Rätsel, ggf. neuer Rätseltyp), dann Umsetzung | Tests grün; allein und zu zweit spielbar; Edge Functions und Migrationen unverändert |
| 7 | `ap7-raum-3` | wie AP 6, Schwierigkeit „schwer“ | wie AP 6; drei Räume auf der Startseite |

**Meilenstein 1 (Prüfablauf):**
- Zwei Browserprofile (A, B) und ein privates Fenster (C).
- A erstellt eine Arbeitszimmer-Sitzung. B tritt per Code bei, kann nicht starten. A startet.
- C erstellt eine eigene Sitzung. C öffnet die Sitzungsadresse von A und hat keinen Zugriff.
- B findet eine Spur, sie erscheint bei A, aber nicht bei C.
- A und B klicken gleichzeitig auf „Tipp“ → genau 1 Tipp und 1 Strafe.
- B lädt neu → derselbe Stand und dieselbe Restzeit.
- Die Zeit läuft ab, während alle Fenster zu sind. Beim nächsten Öffnen zeigt der Server „verloren“.

## Umsetzungshinweise (ergänzt bei der Freigabe am 2026-10-22) [A]
- Schreibende Datenbankfunktionen (`speichere_aktion`, `speichere_zustand`, `tritt_bei`) darf nur das Backend aufrufen. Ausführungsrechte für `anon`/`authenticated` werden entzogen, nur `service_role` darf sie nutzen. Ein Integrationstest prüft, dass direkte Aufrufe aus dem Browser scheitern.
- Beim Wiederverbinden darf zwischen Laden und Realtime-Abonnement keine Änderung verloren gehen. Ablauf: zuerst abonnieren, nach „abonniert“ mit `sitzung-laden` erneut abgleichen. Es werden nur Stände mit höherer Version übernommen. Das gilt auch nach jedem automatischen Neuverbinden von Realtime.
- Vor AP 5 wird ein manuell ausgelöster Deployment-Workflow konkretisiert. In dieser Phase wird noch keine Veröffentlichung eingerichtet. *(aktualisiert 2026-10-23: konkretisiert als Option C – manuell ausgelöster Workflow in GitHub Actions, zunächst nur für die geschützte Testversion.)*

## Offene Entscheidungen [O]
- Die erstellende Person verlässt die Sitzung *vor* dem Start: Niemand sonst darf starten. Bis AP 4 klären.
- Darf man einer schon laufenden Sitzung noch beitreten? Vorschlag: ja bis zum Spielende. Bis AP 3 klären.
- Aufräumen beendeter Sitzungen (z. B. Löschen nach X Tagen).
- Anzeigenamen der Mitspielenden (nicht nötig für Meilenstein 1).
- E-Mail-Konten zusätzlich zum Gastzugang (nach Meilenstein 1).
- Wie wird der manuell ausgelöste Deployment-Workflow genau aufgebaut? Wird vor AP 5 gemeinsam konkretisiert.
- Inhalte von Raum 2 und 3 (eigene Planungen).

## Dokumentation nach Freigabe (laut CLAUDE.md, direkt auf `main`)
1. Plan als `docs/plaene/2026-10-22_mehrspieler-grundlage.md` speichern (Datum per `date`).
2. Planungseintrag „Planung: Mehrspieler-Grundlage mit Supabase“ mit Auslöser, Rückfragen und Antworten (Gastzugang, nur online, Spielregeln, CI, lokales Supabase, Branches), Kurzfassung, Link und verworfenen Alternativen:
   - normalisierte Fortschrittstabellen
   - Raumvorlagen in der Datenbank
   - Event-Sourcing
   - Offline-Modus
   - E-Mail-Konto ab Meilenstein 1
   - Broadcast statt Postgres Changes
   - nur Cloud ohne lokales Supabase
   - CI gegen das Cloud-Projekt
   - pgTAP als zweites Test-Werkzeug
   - Neustart über „Runde“
   - Squash-Merge
3. Entscheidungen in Abschnitt 3 eintragen; `docs/ideen.md` (offene Fragen) aktualisieren.
4. Commit „Doku: Planung zu Mehrspieler-Grundlage“ und Push. Danach Branch `ap1-ci`.
