# Projektregeln für Claude Code

## Projektkontext
Dieses Projekt ist eine WebApp, die im Rahmen einer Seminar-/Projektarbeit entwickelt wird.
Die lückenlose, nachvollziehbare Dokumentation der Entwicklung ist ein zentraler Bestandteil
der Arbeit. Halte dich deshalb bei jeder Aufgabe an die folgenden Regeln.

## Ablauf nach jeder abgeschlossenen Aufgabe
Führe nach jeder abgeschlossenen Aufgabe diese Schritte in genau dieser Reihenfolge aus:

1. Die Code-Änderungen committen (siehe Abschnitt "Versionierung mit Git").
2. Die Kennung dieses Commits mit `git rev-parse --short HEAD` ermitteln.
3. Datum und Uhrzeit mit `date "+%Y-%m-%d, %H:%M"` ermitteln.
4. Einen neuen Eintrag in DOKUMENTATION.md schreiben (siehe Abschnitt "Dokumentation").
5. Den Doku-Eintrag in einem separaten Commit festhalten
   (Nachricht: "Doku: Eintrag zu <Kurztitel>").
6. Beide Commits zu GitHub pushen.

Gib mir danach eine kurze Rückmeldung, dass Commit, Doku-Eintrag und Push erledigt sind.

## Dokumentation
- Die Dokumentation steht in der Datei `DOKUMENTATION.md` im Projektstammordner.
- Neue Einträge werden immer unten im Abschnitt "4. Entwicklungsprotokoll" angehängt,
  exakt im Format der Vorlage, die in dieser Datei als Kommentar hinterlegt ist.
- Datum und Uhrzeit immer mit dem Befehl `date "+%Y-%m-%d, %H:%M"` ermitteln,
  niemals schätzen oder aus dem Gedächtnis eintragen.
- Bestehende Einträge im Entwicklungsprotokoll niemals löschen oder umschreiben,
  nur neue anhängen.
- Im Feld "Auslöser" festhalten, ob die Idee bzw. Anweisung vom Nutzer kam oder ob
  du (Claude) etwas vorgeschlagen hast. Anweisungen des Nutzers möglichst nah am
  Wortlaut wiedergeben.
- Wichtige technische Entscheidungen zusätzlich in die Tabelle in Abschnitt
  "3. Wichtige Entscheidungen" eintragen, mit Begründung und verworfenen Alternativen.
- Abschnitt "2. Aktueller Stand" bei größeren Änderungen aktualisieren
  (Funktionen der App, Ordnerstruktur, wichtigste Dateien).
- Abschnitt "1. Projektüberblick" aktualisieren, wenn sich Tech-Stack oder
  Werkzeuge ändern.
- Gab es bei einer Aufgabe keine Code-Änderung (z. B. nur eine Besprechung, bei der
  eine Entscheidung gefallen ist), trotzdem einen Eintrag schreiben und unter
  "Git-Commit" vermerken: "keiner (keine Code-Änderung)".

## Versionierung mit Git
- Commit-Nachrichten auf Deutsch schreiben, aussagekräftig: was wurde geändert und warum.
- Keine Commits mit unfertigem oder nicht lauffähigem Code ohne entsprechenden
  Hinweis in der Commit-Nachricht.
- Niemals `git push --force` verwenden und niemals bestehende Commits nachträglich
  verändern (kein `--amend` auf bereits gepushte Commits, kein Rebase der Historie).
  Die Git-Historie dient als Beleg für die Dokumentation.
- Wenn ein Push fehlschlägt, mich informieren und nicht eigenmächtig versuchen,
  das Problem durch Überschreiben zu lösen.
