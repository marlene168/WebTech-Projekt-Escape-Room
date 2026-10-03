# Projektdokumentation: Escape-Room

> Diese Datei wird während der Entwicklung fortlaufend von Claude Code gepflegt (Regeln siehe `CLAUDE.md`).
> Einträge im Entwicklungsprotokoll werden nur angehängt und nachträglich nicht verändert.
> Jeder Eintrag verweist auf den zugehörigen Git-Commit im GitHub-Repository.

## 1. Projektüberblick
- **Ziel der App:** Entwicklung einer browserbasierten WebApp, die das Erlebnis eines Escape Rooms digital simuliert. Spielende wählen einen Raum aus und versuchen, durch das Untersuchen anklickbarer Objekte und das Kombinieren von Hinweisen ein Rätsel unter Zeitdruck zu lösen. Als Erweiterung sind mehrere Räume mit unterschiedlichen Themen und Schwierigkeitsgraden vorgesehen.
- **Rahmen:** Seminar-/Projektarbeit, Web Technologie 
- **Zeitraum:** Start 03.10.2026 – laufend
- **Tech-Stack:** [z. B. HTML, CSS, JavaScript, Framework, Datenbank …]
- **Werkzeuge:** VS Code, Claude Code, Git, GitHub, [weitere]
- **Repository:** https://github.com/marlene168/WebTech-Projekt-Escape-Room

## 2. Aktueller Stand
_Noch keine Funktionen umgesetzt._

## 3. Wichtige Entscheidungen
| Datum | Entscheidung | Begründung | Verworfene Alternativen |
|-------|--------------|------------|-------------------------|
| 2026-10-03 | Git-Identität mit GitHub-noreply-Adresse, nur lokal für dieses Repo | Private E-Mail bleibt in der öffentlichen Git-Historie verborgen; Einstellung betrifft nur dieses Projekt | Gmail-Adresse; globale Git-Konfiguration |
| 2026-10-04 | Größere Aufgaben zuerst im Plan-Modus planen; freigegebene Pläne unter `docs/plaene/` ablegen und als eigene Planungseinträge protokollieren | Planungsphase und Entscheidungswege werden nachvollziehbar belegt; Umsetzung lässt sich gegen den Plan prüfen (Abweichungen werden dokumentiert) | Direkte Umsetzung ohne schriftlichen Plan; Plan nur im Chat bzw. nur im Protokolleintrag festhalten |

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
