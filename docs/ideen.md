# Ideensammlung

Hier werden Ideen für die Escape-Room-WebApp gesammelt, auch verworfene, damit nachvollziehbar bleibt, was überlegt wurde und warum es (nicht) umgesetzt wird.

Status: **offen** (noch nicht entschieden), **geplant**, **umgesetzt**, **verworfen**

---

## Raumübergreifende Geschichte mit Gesamträtsel am Ende
- **Status:** verworfen (2026-10-04)
- **Idee:** Alle Räume erzählen zusammen eine durchgehende Geschichte. Die Schwierigkeit steigt von Raum zu Raum, und im letzten Raum findet man den verschwundenen Professor bzw. löst ein Gesamträtsel.
- **Begründung:** Spielende sollen die Räume einzeln und in beliebiger Reihenfolge spielen können, ohne die anderen bzw. eine Vorgeschichte kennen zu müssen. Außerdem kann man durch einzelne, unabhängige Räume komplett andere Themes, Geschichten und Rätsel je Raum simulieren. Dabei ist dann für jeden Geschmack etwas dabei.
- **Stattdessen:** Jeder Raum ist inhaltlich eigenständig, hat eine eigene Vorgeschichte (Intro und Outro) und einen festen Schwierigkeitsgrad. Siehe [Plan Startseite und Vorgeschichte](plaene/2026-10-04_startseite-und-vorgeschichte.md).

## Anmeldung und gemeinsames Spielen: Hosting und Datenbank
- **Status:** geplant (2026-10-22): Variante B (Vercel und Supabase) ist die gewählte Richtung, Variante A ist derzeit nicht gewählt. Vorher (2026-10-20): offen.
- **Entscheidung:** am 2026-10-22 nach einem Planungsgespräch der Nutzerin mit ChatGPT getroffen (siehe Entwicklungsprotokoll und Abschnitt 3 in `DOKUMENTATION.md`). Der Text unten stammt vom 2026-10-20 und bleibt als Entscheidungsgrundlage erhalten.
- **Ziel:** Die App soll öffentlich im Internet erreichbar sein. Spielende sollen ein eigenes Konto anlegen und sich anmelden können. Angemeldete Personen sollen sich zu einer Gruppe zusammenfinden, z. B. über einen Raum-Code, und einen Raum gemeinsam und live synchron lösen. Dafür braucht die App ein Hosting, eine Benutzerverwaltung und eine Echtzeit-Verbindung zwischen den Geräten.
- Beide Varianten bleiben vorerst im Rennen.

### Variante A: Eigener Server mit Express und Socket.IO, Hosting bei Render (derzeit nicht gewählt)
- **Herkunft:** Vorschlag von Claude im [Plan der ersten Version](plaene/2026-10-04_erste-version.md) (Abschnitt „Spätere Erweiterungen“). Das Seminar macht keine technischen Vorgaben.
- **Funktionsweise:** Der vorhandene `server.js` läuft dauerhaft bei einem Node-Hoster wie Render. Socket.IO hält zu jedem Browser eine offene Verbindung (WebSocket). Der Server verwaltet je Raum-Code einen Spielstand und führt dafür dieselbe `shared/spiel-logik.js` aus. Klickt jemand, schickt der Browser die Aktion an den Server. Der Server berechnet den neuen Spielstand und sendet ihn an alle Mitspielenden. Im Browser ersetzt `verbindung-online.js` die lokale Verbindung.
- **Anmeldung und Datenbank:** nicht enthalten. Sie müssten zusätzlich gebaut werden, z. B. mit einer Datenbank und Passwort-Verschlüsselung oder mit einem fertigen Dienst wie Supabase Auth.
- **Vorteile:** baut direkt auf dem bestehenden Code auf. Der Server ist der Schiedsrichter, deshalb kann niemand den Spielstand im Browser manipulieren. Es ist alles eigener, nachvollziehbarer JavaScript-Code, was gut zum WebTech-Seminar passt.
- **Nachteile:** Anmeldung, Datenbank und Sicherheit müssen selbst gebaut werden. Im kostenlosen Tarif schläft der Server bei Render nach etwa 15 Minuten ohne Nutzung ein, der erste Aufruf dauert danach rund 30–60 s. Spielstände liegen nur im Arbeitsspeicher und gehen bei einem Neustart verloren.

### Variante B: Hosting bei Vercel, Anmeldung und Echtzeit über Supabase (gewählt am 2026-10-22)
- **Herkunft:** Wunsch der Nutzerin (2026-10-20).
- **Korrektur (2026-10-22):** Die Aussage unten, Vercel könne keine dauerhaften WebSocket-Verbindungen halten, ist veraltet. Laut offizieller Vercel-Dokumentation können Vercel Functions WebSocket-Verbindungen bedienen, auf allen Tarifen und auch mit Socket.IO. Seit Ende Juni 2026 war das in der Public Beta, seit dem 2026-10-20 ist es allgemein verfügbar. Einschränkungen: Fluid compute muss aktiv sein. Eine Verbindung endet spätestens mit der maximalen Funktionsdauer (Hobby: 300 s), deshalb braucht der Browser Logik zum Neuverbinden. Gemeinsamer Zustand muss in einem externen Speicher liegen, weil Verbindungen auf verschiedenen Instanzen landen können. Die Wahl von Supabase Realtime für die Echtzeit-Kommunikation bleibt davon unberührt. Quellen: [Vercel Docs: WebSockets](https://vercel.com/docs/functions/websockets) (Stand 2026-08-10), [Vercel Changelog: WebSocket support is now generally available](https://vercel.com/changelog/websocket-support-is-now-generally-available) (2026-10-20), [Vercel Docs: Functions Limits](https://vercel.com/docs/functions/limitations), abgerufen am 2026-10-22.
- **Funktionsweise:** Vercel liefert die Seiten aus. Eigener Server-Code läuft dort nur kurzzeitig als Serverless-Funktion und kann keine dauerhaften WebSocket-Verbindungen halten, Socket.IO fällt also weg. Supabase übernimmt die Anmeldung (Supabase Auth), die Datenbank (PostgreSQL, z. B. für Spielstände, Raum-Codes und Bestenlisten) und die Live-Synchronisation (Supabase Realtime). Die Browser senden Aktionen über Supabase und empfangen den neuen Spielstand.
- **Vorteile:** Anmeldung (E-Mail, Google …) und Datenbank sind fertig vorhanden. Kein Server schläft ein, Spielstände bleiben gespeichert. Vercel und Supabase sind gängige, moderne Werkzeuge mit kostenlosem Einstieg.
- **Nachteile:** Es muss geklärt werden, wer die Spiellogik ausführt: der Browser (einfach, aber manipulierbar) oder eine Supabase-Funktion bzw. Datenbankregeln (sicher, aber aufwendiger). `server.js` wird voraussichtlich überflüssig. Es kommen zwei externe Dienste mit eigenen Konten, Schlüsseln und Sicherheitsregeln (Row Level Security) hinzu.

### Offene Fragen für die Planung
- Wo läuft die Spiellogik im Mehrspieler-Modus?
- Wie läuft der Beitritt ab (Raum-Code, Lobby, gemeinsamer Start)?
- Welche Anmeldearten soll es geben?
- Ist eine Mischung sinnvoll, z. B. Variante A mit Supabase Auth für die Anmeldung?

### Stand nach der Planung mit ChatGPT (2026-10-22)
- **Zu den Fragen oben:**
  - Spiellogik: Das Backend entscheidet über den Spielstand, bevorzugt mit Supabase Edge Functions. Die genaue Aufteilung zwischen Edge Functions und Datenbankoperationen ist noch offen.
  - Beitritt: Jede Sitzung bekommt einen Beitrittscode. Die Details sind offen.
  - Mischung aus A und B: derzeit nicht gewählt.
  - Anmeldearten: weiterhin offen.
- **Rolle von `server.js`:** noch zu klären. Die Entfernung ist nicht beschlossen.
- **Weitere offene Fragen:**
  - Ist ein Konto nötig, oder gibt es einen Gastzugang (für Einzelspieler und für Mehrspieler)?
  - Wie groß darf eine Gruppe höchstens sein?
  - Wer darf starten, neu starten und Tipps mit gemeinsamer Zeitstrafe anfordern?
  - Was passiert, wenn die erstellende Person die Sitzung verlässt?
  - Wie werden Sitzungen beendet und später aufgeräumt?
  - Wie werden gleichzeitige Aktionen technisch behandelt?
- **Nächster Schritt:** Datenmodell, Schnittstellen und Berechtigungsregeln gemeinsam ausarbeiten. Es gibt noch keine endgültigen Tabellen und keine Implementierungsdetails.

### Stand nach der Planung „Mehrspieler-Grundlage“ (2026-10-22)
Siehe [Plan Mehrspieler-Grundlage](plaene/2026-10-22_mehrspieler-grundlage.md) und Abschnitt 3 in `DOKUMENTATION.md`.
- **Entschieden:**
  - Gastzugang für Meilenstein 1, gespielt wird nur online.
  - Beitritt per Code, Laden per ID nur für Mitglieder.
  - Nur die erstellende Person startet, höchstens vier Personen, alle dürfen Tipps anfordern.
  - Erneutes Spielen erzeugt eine neue Sitzung.
  - Spiellogik in Edge Functions, Speichern über atomare Datenbankfunktionen.
  - `server.js` bleibt als lokaler Entwicklungsserver.
- **Weiterhin offen:**
  - Was passiert, wenn die erstellende Person die Sitzung *vor* dem Start verlässt (sonst darf niemand starten)? Bis AP 4 klären.
  - ~~Darf man einer bereits laufenden Sitzung noch beitreten?~~ Entschieden am 2026-10-22: Neue Mitglieder treten nur im Status „bereit“ bei (vor dem Spielstart). Bereits vorhandene Mitglieder steigen nach Neuladen oder Verbindungsabbruch jederzeit wieder ein, der Timer läuft dabei weiter. Der Vorschlag „ja, bis zum Spielende“ wurde nicht übernommen.
  - Wie werden beendete Sitzungen aufgeräumt (z. B. Löschen nach X Tagen)?
  - Anzeigenamen der Mitspielenden.
  - E-Mail-Konten zusätzlich zum Gastzugang.
  - Wie wird der manuell ausgelöste Deployment-Workflow aufgebaut? Vor AP 5 klären.
  - Inhalte von Raum 2 und 3 (eigene Planungen).

## Rangliste mit Anzeigenamen und Bestzeiten
- **Status:** geplant als spätere Erweiterung (2026-10-22)
- **Idee:** Eine Rangliste zeigt Anzeigenamen und Bestzeiten je Raum.
- **Begründung:** Die Rangliste soll ausdrücklich Wiederholung und Geschwindigkeit messen. Wer die Lösung schon kennt, wird deshalb nicht ausgeschlossen.
- **Offen:** Einzel- und Teamergebnisse, Bewertungsregeln (z. B. wie Tipps zählen).

## Gestaltung und Atmosphäre
- **Status:** offen (2026-10-22)
- **Idee:** Design und Atmosphäre sind wichtig für das Spielerlebnis. Die endgültige Gestaltung steht noch nicht fest.
- **Vorgehen:** Die Gestaltung wird abgestimmt, bevor die Grafiken in größerem Umfang umgesetzt werden.
