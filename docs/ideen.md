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
- **Status:** offen (2026-10-20), Entscheidung in einer eigenen Planung im Plan-Modus
- **Ziel:** Die App soll öffentlich im Internet erreichbar sein. Spielende sollen ein eigenes Konto anlegen und sich anmelden können. Angemeldete Personen sollen sich zu einer Gruppe zusammenfinden, z. B. über einen Raum-Code, und einen Raum gemeinsam und live synchron lösen. Dafür braucht die App ein Hosting, eine Benutzerverwaltung und eine Echtzeit-Verbindung zwischen den Geräten.
- Beide Varianten bleiben vorerst im Rennen.

### Variante A: Eigener Server mit Express und Socket.IO, Hosting bei Render
- **Herkunft:** Vorschlag von Claude im [Plan der ersten Version](plaene/2026-10-04_erste-version.md) (Abschnitt „Spätere Erweiterungen“). Das Seminar macht keine technischen Vorgaben.
- **Funktionsweise:** Der vorhandene `server.js` läuft dauerhaft bei einem Node-Hoster wie Render. Socket.IO hält zu jedem Browser eine offene Verbindung (WebSocket). Der Server verwaltet je Raum-Code einen Spielstand und führt dafür dieselbe `shared/spiel-logik.js` aus. Klickt jemand, schickt der Browser die Aktion an den Server. Der Server berechnet den neuen Spielstand und sendet ihn an alle Mitspielenden. Im Browser ersetzt `verbindung-online.js` die lokale Verbindung.
- **Anmeldung und Datenbank:** nicht enthalten. Sie müssten zusätzlich gebaut werden, z. B. mit einer Datenbank und Passwort-Verschlüsselung oder mit einem fertigen Dienst wie Supabase Auth.
- **Vorteile:** baut direkt auf dem bestehenden Code auf. Der Server ist der Schiedsrichter, deshalb kann niemand den Spielstand im Browser manipulieren. Es ist alles eigener, nachvollziehbarer JavaScript-Code, was gut zum WebTech-Seminar passt.
- **Nachteile:** Anmeldung, Datenbank und Sicherheit müssen selbst gebaut werden. Im kostenlosen Tarif schläft der Server bei Render nach etwa 15 Minuten ohne Nutzung ein, der erste Aufruf dauert danach rund 30–60 s. Spielstände liegen nur im Arbeitsspeicher und gehen bei einem Neustart verloren.

### Variante B: Hosting bei Vercel, Anmeldung und Echtzeit über Supabase
- **Herkunft:** Wunsch der Nutzerin (2026-10-20).
- **Funktionsweise:** Vercel liefert die Seiten aus. Eigener Server-Code läuft dort nur kurzzeitig als Serverless-Funktion und kann keine dauerhaften WebSocket-Verbindungen halten, Socket.IO fällt also weg. Supabase übernimmt die Anmeldung (Supabase Auth), die Datenbank (PostgreSQL, z. B. für Spielstände, Raum-Codes und Bestenlisten) und die Live-Synchronisation (Supabase Realtime). Die Browser senden Aktionen über Supabase und empfangen den neuen Spielstand.
- **Vorteile:** Anmeldung (E-Mail, Google …) und Datenbank sind fertig vorhanden. Kein Server schläft ein, Spielstände bleiben gespeichert. Vercel und Supabase sind gängige, moderne Werkzeuge mit kostenlosem Einstieg.
- **Nachteile:** Es muss geklärt werden, wer die Spiellogik ausführt: der Browser (einfach, aber manipulierbar) oder eine Supabase-Funktion bzw. Datenbankregeln (sicher, aber aufwendiger). `server.js` wird voraussichtlich überflüssig. Es kommen zwei externe Dienste mit eigenen Konten, Schlüsseln und Sicherheitsregeln (Row Level Security) hinzu.

### Offene Fragen für die Planung
- Wo läuft die Spiellogik im Mehrspieler-Modus?
- Wie läuft der Beitritt ab (Raum-Code, Lobby, gemeinsamer Start)?
- Welche Anmeldearten soll es geben?
- Ist eine Mischung sinnvoll, z. B. Variante A mit Supabase Auth für die Anmeldung?
