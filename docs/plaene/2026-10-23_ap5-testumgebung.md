# Detailplanung AP 5: Geschützte Online-Testversion mit Deployment per Knopf

> **Konkretisierung und Aktualisierung** des Arbeitspakets 5 aus dem
> [Plan Mehrspieler-Grundlage](2026-10-22_mehrspieler-grundlage.md) (dort: „AP 5 – Cloud und Vercel“).
> Wo dieser Detailplan von dort abweicht, gilt der Detailplan. Im ursprünglichen Plan wird darauf verwiesen (siehe Abschnitt 9).

## Kontext
AP 1 bis 4 sind abgeschlossen. Meilenstein 1 läuft lokal. Bevor AP 6 und AP 7 (Raum 2 und 3) beginnen, soll das vorhandene Arbeitszimmer **online in einer geschützten Testversion** geprüft werden. So zeigt sich das Zusammenspiel von Vercel und Supabase früh.

Entscheidungen der Nutzerin vom 2026-10-23:
- **Deployment-Ablauf:** Option C, also ein manuell ausgelöster Workflow in GitHub Actions. Er ist keine Freigabe für eine Veröffentlichung.
- **AP 5 stellt ausschließlich die Testversion bereit.**
- **Zugriffsschutz der Testversion:**
  - Vercel Hobby mit Vercel Authentication für **„All Deployments“**, einschließlich der Hauptadresse.
  - Zwei Personen mit eigenen Vercel-Konten, die zweite wird ausdrücklich freigeschaltet.
  - **Kein kostenpflichtiger Tarif ohne Zustimmung der Nutzerin.**
- **Die Testversion darf wiederholt aktualisiert werden.** Die **öffentliche Version** mit eigenem Supabase-Projekt und ohne Vercel-Anmeldung folgt erst nach ausdrücklicher Freigabe.
- **Missbrauchsschutz schon in AP 5:** CAPTCHA (Turnstile) für die Gastanmeldung, geprüft durch Supabase, mit angemessenen Cloud-Limits. Das Backend wird **nicht** auf die zwei Testpersonen beschränkt, damit ein späterer öffentlicher Gastbetrieb möglich bleibt.
- **GitHub Free:** Repository-Secrets. GitHub Pro ist beantragt. Erst wenn Pro bestätigt aktiv ist, wird ein Umzug in Environments geprüft. Die Umsetzung wartet nicht darauf.

Legende: **[A]** Anforderung bzw. Entscheidung der Nutzerin · **[V]** technischer Vorschlag von Claude · **[O]** offen

**Einordnung der Pipeline** [A]: Die Pipeline besteht aus zwei Teilen.
- Die **automatische CI** (`ci.yml`, bei jedem Push und Pull Request).
- Der **manuell gestartete Deployment-Workflow** (`deploy.yml`). Er verwendet die **bestehenden Tests** der CI und stellt danach **ausschließlich die geschützte Testversion** bereit.

## 1. Umgebungen [A]
| | **Test (AP 5)** | **Öffentlich (später, nur nach ausdrücklicher Freigabe)** |
|---|---|---|
| Supabase | Cloud-Projekt `escape-room-test` | eigenes, separates Projekt (wird erst bei Freigabe angelegt) |
| Vercel | Projekt `escape-room-test`, Hobby, Vercel Authentication „All Deployments“ | eigenes Projekt ohne Vercel-Anmeldung (erst bei Freigabe) |
| Spieladresse | **stabile Test-Hauptadresse** (z. B. `escape-room-test-….vercel.app`) | wird bei Freigabe festgelegt |
| Deployment | Workflow „Deploy“, Ziel `test`, beliebig oft | Ziel wird erst nach Freigabe ergänzt |
| Secrets (GitHub Free) | Repository-Secrets `TEST_…` | später `OEFFENTLICH_…` bzw. eigenes Environment bei Pro |

- Nach AP 5 gibt es für die öffentliche Version nichts: kein Projekt, keine Secrets, kein Workflow-Ziel.
- Der kostenlose Supabase-Tarif erlaubt zwei aktive Projekte, genug für Test und Öffentlich.

## 2. Zugriffsschutz der Testversion
- **Methode:** Vercel Authentication, Umfang **„All Deployments“**. Das schützt die Hauptadresse und alle generierten Deployment-URLs und ist laut Vercel auf allen Tarifen kostenlos. Einen Passwortschutz gibt es im Hobby-Tarif nicht.
- **Berechtigt:**
  - die Nutzerin (Kontoinhaberin)
  - **eine** weitere Person mit eigenem kostenlosen Vercel-Konto. Sie stellt eine Zugriffsanfrage, die Nutzerin gibt sie ausdrücklich frei. Mehr externe Personen erlaubt der Hobby-Tarif nicht.
- **Nicht verwendet:** „Shareable Links“. Das sind geheime Links, also nur eine unbekannte URL.
- **Bei wiederholten Deployments mitprüfen** [O]: Laut Vercel sieht eine freigegebene externe Person „die neueste Bereitstellung eines Branches“. Ob Schutz und Freischaltung nach einem **weiteren** CLI-Deployment bestehen bleiben, wird ausdrücklich getestet (siehe Prüfkriterien). Falls nicht, legt Claude der Nutzerin Ausweichmöglichkeiten vor, z. B. Deployments mit Git-Verknüpfung, aber weiterhin nur per Knopf. Ein kostenpflichtiger Tarif kommt nur mit ihrer Zustimmung.

## 3. Adresszuordnung (kein Zugriffsschutz)
- [V] `public/js/supabase-konfig.js` ordnet den **Hostnamen** einem Backend zu: `localhost`/`127.0.0.1` → lokales Supabase, Test-Hauptadresse → `escape-room-test`, alles andere → kein Backend („Online-Spiel nicht eingerichtet“).
- **Zweck:** verhindert, dass eine Seite versehentlich mit dem falschen Backend arbeitet. **Kein Zugriffsschutz**, denn Berechtigungen sichern weiterhin RLS und die Edge Functions im Backend.
- **Folge:** Gespielt wird über die **stabile Test-Hauptadresse**. Wechselnde Deployment-Adressen (`…-abc123….vercel.app`) haben kein Backend und sind **nicht spielbar**. Das ist so gewollt und steht in der Anleitung.

## 4. Missbrauchsschutz und Abwägung zum Backend-Schutz
**Ausgangslage:** Der Vercel-Schutz gilt nur für die Website. Das Supabase-Backend ist technisch aus dem Internet erreichbar, weil der Browser es direkt anspricht. Adresse und öffentlicher Schlüssel sind kein Geheimnis. Wer sie kennt, könnte Gastkonten anlegen und Edge Functions aufrufen.

**Bewusst nicht gemacht** [A]: Das Backend wird nicht auf die zwei Testpersonen beschränkt, z. B. über eine Liste erlaubter Nutzer. Das passt nicht zum späteren öffentlichen Gastbetrieb und würde Test und Produktion unterschiedlich machen.

**Maßnahmen in AP 5:**
1. **CAPTCHA mit Cloudflare Turnstile bei der Gastanmeldung** [A] (von Supabase für Gastanmeldungen dokumentiert und empfohlen):
   - Der Browser zeigt das Turnstile-Widget (Site-Key öffentlich) und schickt das Token mit `signInAnonymously({ options: { captchaToken } })`.
   - **Supabase prüft das Token serverseitig** mit dem Turnstile-Secret, eingetragen im Supabase-Dashboard unter Authentication → Bot and Abuse Protection. Eine reine Prüfung im Browser gibt es nicht.
   - **Turnstile wird nur geladen, wenn tatsächlich eine Gastanmeldung nötig ist**, also wenn im Browser keine gültige Anmeldung vorliegt. Eine gültige Gastanmeldung wird weiterverwendet, auch nach dem Neuladen.
   - **Ein Token gilt nur für einen Anmeldeversuch.** Turnstile-Tokens sind einmalig verwendbar und laufen nach kurzer Zeit ab. Scheitert eine Anmeldung oder ist das Token abgelaufen bzw. verbraucht, holt der Browser für den nächsten Versuch ein **frisches Token** (Widget zurücksetzen) und meldet sich erneut an.
   - **Kein erneutes CAPTCHA für neue Sitzungen und Spielaktionen:** Nach einer gültigen Gastanmeldung laufen sie über das normale Anmelde-Token.
   - Lokal und in der CI bleibt CAPTCHA aus (`config.toml`), die Backend-Tests sind davon unabhängig.
2. **Cloud-Limit für Gastanmeldungen:** Supabase-Standard von **30 pro Stunde und IP-Adresse** beibehalten. Das reicht für eine Gruppe im selben WLAN. Die lokalen Testwerte (10 000) werden **nicht** übernommen, und `supabase config push` wird nicht benutzt.
3. **Einfache Begrenzung beim Erstellen von Sitzungen** [V/A]:
   - `erstelle_sitzung` lehnt ab, wenn derselbe Gast in der letzten Stunde schon **10 Sitzungen** erstellt hat (Antwort 429 „zu_viele_sitzungen“).
   - **Auch bei parallelen Anfragen sicher:** Die Funktion holt zuerst eine Transaktionssperre pro Gast (`pg_advisory_xact_lock` auf die Nutzer-ID). Zählen und Anlegen laufen dadurch für denselben Gast nacheinander ab. Andere Gäste werden nicht blockiert.
   - **Backend-Tests:**
     - 11 Erstellungen nacheinander: die 11. wird abgelehnt.
     - **15 gleichzeitige Erstellungen** eines neuen Gastes: genau 10 gelingen, 5 erhalten 429, in der Datenbank stehen genau 10 Sitzungen.
   - **Meldung im Browser:**
     - auf der Startseite und bei „Nochmal spielen“: „Du hast in der letzten Stunde schon zehn Sitzungen erstellt. Bitte warte etwas oder tritt einer bestehenden Sitzung per Code bei.“
   - Begründung: **Massenhaft erstellte Spielsitzungen sollen begrenzt werden.** Jede Sitzung belegt Datenbankzeilen und einen Beitrittscode, und ein Skript könnte sonst mit einer einzigen Gastanmeldung sehr viele davon anlegen. Das ist nicht die einzige wachsende Stelle, auch die Aktionen-Tabelle wächst (siehe verbleibende Risiken). Die Prüfung steckt in einer neuen Migration, ohne zusätzliche Infrastruktur.

**Geprüft und bewusst nicht begrenzt** (verbleibende Risiken):
- **Spielaktionen:**
  - Nur Mitglieder dürfen Aktionen ausführen, und eine Sitzung hat höchstens 4 Personen. **Fremde Spielstände bleiben geschützt.**
  - **Risiko:** Ein Gast könnte in seiner eigenen Sitzung sehr viele Aktionen senden, z. B. Fehlversuche. Das **verbraucht gemeinsame Supabase-Kontingente**: Aufrufe von Edge Functions, Datenbankspeicher (die Aktionen-Tabelle wächst pro Aktion) und Rechenzeit. Im kostenlosen Tarif kann das **andere Spielende beeinträchtigen**, etwa durch langsamere Antworten oder ein ausgeschöpftes Monatskontingent.
  - In der geschützten Testversion mit zwei berechtigten Personen und CAPTCHA ist das Risiko gering und wird **für AP 5 akzeptiert**.
  - **Zusätzliche Aktionslimits** sind ein **Prüfpunkt vor der öffentlichen Freigabe**, z. B. eine Obergrenze an Aktionen pro Gast und Minute in `speichere_aktion`.
- **Erraten von Beitrittscodes:**
  - Es gibt etwa 1 Milliarde mögliche Codes, beitreten geht nur vor dem Start, und eine Sitzung hat höchstens 4 Plätze.
  - Gezieltes Erraten ist praktisch aussichtslos, zufällige Treffer bei wenigen offenen Sitzungen sind unwahrscheinlich.
  - Akzeptiert.
- **CAPTCHA schützt nur die Anmeldung:** Ein einmal angemeldeter Gast kann mit seinem Token weiter Aufrufe machen. Dagegen helfen die Begrenzungen oben, RLS und die Prüfungen in den Edge Functions.
- **Beendete Sitzungen bleiben liegen.** Das Aufräumen ist eine spätere Aufgabe, vor der öffentlichen Freigabe.

## 5. Deine Einrichtungsschritte
Geheime Werte gibst du **direkt** in GitHub, Supabase oder Vercel ein, nie im Chat. Öffentliche Werte gibst du mir (📋).

**Supabase (Test)**
1. supabase.com → **New project** `escape-room-test`, Region **Frankfurt (eu-central-1)**, kostenloser Tarif. Datenbank-Passwort im Passwortmanager speichern.
2. **Authentication → Sign In / Providers:** „Allow anonymous sign-ins“ einschalten.
3. **Authentication → Rate Limits:** Gastanmeldungen beim Standard von 30 pro Stunde lassen (nur prüfen).
4. 📋 **Project URL** und **Publishable Key** an mich, **Projekt-ID** notieren. **Account → Access Tokens:** Token „github-deploy-test“.

**Vercel (Test)**

5. vercel.com, Hobby-Tarif. Im Projektordner `npx vercel login`, dann `npx vercel link` (neues Projekt `escape-room-test`, **ohne** Git-Verbindung). Daraus `.vercel/project.json` mit `orgId` und `projectId`.
6. 📋 Projekt → **Settings → Domains:** die stabile **Hauptadresse** an mich.
7. **Settings → Deployment Protection:** Vercel Authentication **an**, Umfang **All Deployments**. Unter **Protection Bypass for Automation** ein Geheimnis erzeugen.
8. **Account Settings → Tokens:** Token „github-deploy-test“ (Gültigkeit z. B. bis Semesterende).

**Cloudflare Turnstile**

9. Kostenloses Cloudflare-Konto → **Turnstile → Add widget**: Modus „Managed“, Hostname = Test-Hauptadresse aus Schritt 6. 📋 **Site Key** an mich. Den **Secret Key** im Supabase-Dashboard unter **Authentication → Bot and Abuse Protection → Enable CAPTCHA** (Provider Turnstile) eintragen.

**GitHub (Free, Repository-Secrets)**

10. **Settings → Secrets and variables → Actions:**
    - `TEST_SUPABASE_ACCESS_TOKEN`, `TEST_SUPABASE_DB_PASSWORD`, `TEST_SUPABASE_PROJECT_ID`
    - `TEST_VERCEL_TOKEN`, `TEST_VERCEL_ORG_ID`, `TEST_VERCEL_PROJECT_ID`, `TEST_VERCEL_BYPASS`

**Zweite Person** (erst nach erfolgreicher Prüfung des Zugriffsschutzes)

11. Eigenes kostenloses Vercel-Konto, Testadresse öffnen, Zugriff anfragen. Du gibst die Anfrage unter **Deployment Protection → Requests** frei.

## 6. Was ich umsetze [V] (Branch `ap5-testumgebung`)
- **`.github/workflows/deploy.yml`:**
  - Nur `workflow_dispatch`, Eingabe `ziel` (zurzeit nur `test`). Erster Schritt: Abbruch, falls nicht auf `main`.
  - **Festgehaltener Commit:** Alle Jobs checken genau `github.sha` des Auslösezeitpunkts aus, auch der wiederverwendete CI-Workflow. Der Commit erscheint in der Zusammenfassung.
  - **Keine gleichzeitigen Deployments:** `concurrency: { group: deploy-test, cancel-in-progress: false }`.
    - Ein **laufendes** Deployment wird nie automatisch abgebrochen, und es läuft nie mehr als eines gleichzeitig.
    - **Tatsächliches Verhalten:** GitHub hält pro Gruppe höchstens **einen** wartenden Lauf. Wird ein weiterer ausgelöst, während schon einer wartet, ersetzt der neue den wartenden, und der ältere wartende Lauf wird verworfen. Alle wartenden Läufe zu erhalten, garantiert diese Einstellung also nicht.
    - Für unser Projekt ist das ausreichend. Deployments werden selten und bewusst ausgelöst, eine größere Warteschlange ist nicht nötig. Im Zweifel nach dem laufenden Deployment einfach erneut auslösen.
  - **Ablauf, jeweils nur nach Erfolg des vorigen Jobs:**
    1. `pruefen`: `ci.yml` per `workflow_call`, dieselben Unit- und Backend-Tests.
    2. `supabase`: `link`, `db push`, `functions deploy --use-api`.
    3. `vercel`: `vercel deploy --prod`, liefert die Deployment-Adresse.
    4. `rauchtest` (siehe unten).
  - **Fehlerfall:** Der Ablauf stoppt beim ersten Fehler. Jeder Job schreibt in die Zusammenfassung, was erledigt ist (z. B. „Migration angewendet, Funktionen deployt, Vercel noch nicht“). Es gibt **kein automatisches Zurücksetzen** der Datenbank: Man korrigiert gezielt und löst den Workflow erneut aus. `db push` und `functions deploy` sind wiederholbar.
  - **Verträglichkeit:** Da das Backend vor dem Frontend aktualisiert wird, läuft kurz die vorherige Website gegen das neue Backend. Backend-Änderungen bleiben deshalb **mit der vorherigen Website verträglich**: nur ergänzen, nichts entfernen oder umbenennen, oder in zwei Deployments nacheinander. Das steht als Regel in der Anleitung.
- **Rauchtest (präzise, ein beliebiger Fehlerstatus zählt nicht):**
  1. **Ohne Anmeldung** auf Hauptadresse **und** Deployment-URL: Erwartet wird die **Vercel-Zugriffssperre**, also der Status der Vercel-Authentifizierung (Weiterleitung zum Vercel-Login bzw. Vercel-Anmeldeseite, erkennbar an Vercel-typischen Merkmalen). Zusätzlich darf die Antwort **keine** Spielinhalte enthalten. Die genauen Merkmale werden beim ersten Lauf ermittelt, festgehalten und dann fest geprüft.
  2. **Mit Automatisierungs-Bypass** (Header `x-vercel-protection-bypass`). Ein einfacher HTML-Abruf prüft nur HTML und öffentliche Dateien:
     - Die Startseite liefert das erwartete HTML (Titel „Escape Room – Raumauswahl“, Raumliste, Code-Feld, eingebundene Skripte). Die Raumkarten entstehen erst durch JavaScript, die prüft der Browser-Test (siehe unten).
     - `/shared/raeume/arbeitszimmer.js` liefert 200 mit der erwarteten Raum-ID und ohne Lösung.
     - **Nicht erreichbar** (Vercel-„Nicht gefunden“, nicht die Zugriffssperre): die **tatsächlichen geheimen Pfade** `/supabase/functions/_shared/raeume/arbeitszimmer.geheim.js` und `/supabase/functions/_shared/raeume/geheim.js`, ebenso `/shared/raeume/geheim.js`, `/server.js`, `/package.json`, `/supabase/config.toml`.
  3. **Upload-Auswahl:** Über die Vercel-API (Dateiliste des Deployments, mit Token) wird geprüft, dass **nur `public/**` und `vercel.json`** hochgeladen wurden.
  4. **Backend ohne Nutzeranmeldung:** Aufruf von `sitzung-erstellen` mit dem **gültigen** Publishable Key, aber **ohne** Anmelde-Token. Erwartet wird eine Ablehnung **wegen fehlender Authentifizierung**. Geprüft werden Status und Fehlerangabe der Antwort, deren genaue Form beim ersten Lauf festgehalten wird. Wie ein ungültiger Projektschlüssel beantwortet wird, ist dafür nicht maßgeblich und wird nicht vorausgesetzt.
  5. **CAPTCHA wird von Supabase geprüft:** Gastanmeldung beim Auth-Endpunkt **ohne** Token und mit einem **ungültigen** Token. Beide werden mit CAPTCHA-Fehler abgelehnt.
- **Browser-Prüfung** (durch die Nutzerin bzw. beide Testpersonen, mit Screenshots für den Nachweis):
  - Raumkarten sind sichtbar.
  - Die Gastanmeldung mit Turnstile gelingt.
  - Sitzung erstellen und Raum betreten (Spielstart).
  - Eine weitere Sitzung und Spielaktionen gehen ohne erneutes CAPTCHA. Turnstile wird bei bestehender Anmeldung nicht geladen.
  - Die Meldung zum Sitzungslimit ist verständlich. Sie wird lokal mit dem Backend-Test-Szenario geprüft, nicht in der Cloud.
- **CAPTCHA-Ablauftest (Entwicklungstest, einmalig nach dem Einbau):**
  - Nach dem Einbau in AP 5 prüft Claude gezielt, dass nach einem **abgelaufenen oder verbrauchten** Token ein neuer Versuch mit **frischem** Token gelingt.
  - Vorher muss tatsächlich ein Token erzeugt worden sein. Mögliche Wege: das Widget lösen und erst nach Ablauf der Gültigkeit anmelden, oder dasselbe Token ein zweites Mal verwenden.
  - Das ist **keine zusätzliche Prüfung für Spielende** und **kein Pflichtschritt bei jedem Deployment**. Er wird **wiederholt, wenn sich die Anmeldelogik ändert**.
  - **Der Bypass bleibt geheim:** nur als Secret in einer Umgebungsvariable des Workflows, nie ausgegeben (GitHub maskiert Secrets zusätzlich), nie im Browser-Code, nie in der Zusammenfassung.
- **`vercel.json`:** `framework: null`, `outputDirectory: "public"`, kein Build, `git.deploymentEnabled: false`.
- **`.vercelignore`:** nur `public/` und `vercel.json` werden hochgeladen, also kein `server.js`, kein `supabase/`, keine Tests und Doku. **`.gitignore`:** `.vercel/`.
- **Browser:**
  - `supabase-konfig.js` mit Hostname-Zuordnung (siehe Abschnitt 3) und Turnstile-Site-Key je Umgebung.
  - `verbindung-online.js` holt bei Bedarf ein Turnstile-Token (Cloudflare-Skript wird nur dann geladen), bevor es die Gastanmeldung startet.
  - Kleine Fläche für das Widget auf Start- und Spielseite. Lokal gibt es kein CAPTCHA.
- **Backend:** neue Migration mit dem Sitzungslimit in `erstelle_sitzung`, mit Transaktionssperre pro Gast. Die Edge Function antwortet dann mit 429 „zu_viele_sitzungen“. Dazu Backend-Tests: nacheinander und 15 parallel. Meldung in `start.js` und bei „Nochmal spielen“ (`main.js`).
- **Turnstile im Browser:**
  - Das Cloudflare-Skript wird nur geladen, wenn eine Gastanmeldung tatsächlich nötig ist. Eine gültige Anmeldung wird weiterverwendet.
  - Für jeden Anmeldeversuch ein frisches Token (Widget nach Versuch bzw. Ablauf zurücksetzen).
  - Bei Fehlern verständliche Meldung, ein neuer Versuch ist möglich.
- **`docs/anleitung.md`:**
  - Abschnitt „Testversion aktualisieren“: Auslösen, Ablauf, Fehlerfälle, Verträglichkeitsregel, Zugriff für die zweite Person, nur über die Hauptadresse spielen.
  - **Checkliste vor Tests und Präsentationen:**
    1. Supabase-Projektstatus prüfen und ein pausiertes Projekt wiederherstellen.
    2. Testversion aufrufen, eine Sitzung erstellen und **den Raum betreten** (vollständiger Spielstart). Nur das Dashboard zu öffnen genügt nicht.
    3. Optional den Deploy-Workflow erneut auslösen.

## 7. Ablauf
1. Planungsdoku auf `main` (Abschnitt 10).
2. Deine Einrichtungsschritte 1 bis 10 (ohne die zweite Person), 📋-Werte an mich.
3. Umsetzung auf `ap5-testumgebung`. CI grün, Pull Request, Merge nach deiner Freigabe (Merge-Commit).
4. **Du startest Deploy #1** (Ziel `test`). Ich werte den Lauf aus und halte die Merkmale der Vercel-Sperre fest.
5. **Zugriffsschutz prüfen, vor dem gemeinsamen Test:** Rauchtest und deine Prüfung in einem privaten Fenster (Hauptadresse und Deployment-URL).
6. Die zweite Person fragt Zugriff an, du schaltest sie frei.
7. **Deploy #2** (unverändert erneut auslösen). Danach prüfen, ob Schutz **und** Freischaltung noch gelten.
8. Gemeinsame Online-Prüfung (Prüfkriterien).
9. Nachweise und Korrekturen auf `ap5-nachweis`, mit Doku-Eintrag und Pull Request.

## 8. Prüfkriterien für AP 5 [A]
- **Zugriffsschutz** (vor dem gemeinsamen Test, nach Deploy #1 **und** #2):
  - Ohne Vercel-Login erscheint die Vercel-Sperre auf Hauptadresse und Deployment-URL.
  - Ein fremdes Vercel-Konto ohne Freigabe sieht nur die Zugriffsanfrage.
  - Die freigeschaltete Person hat nach Deploy #2 weiterhin Zugriff.
- **Missbrauchsschutz:**
  - Gastanmeldung ohne Token und mit ungültigem Token wird von Supabase abgelehnt (Rauchtest).
  - Mit Turnstile klappt die Anmeldung im Browser.
  - Der CAPTCHA-Ablauftest ist einmal bestanden (frisches Token nach abgelaufenem bzw. verbrauchtem Token).
  - Bei gültiger Gastanmeldung wird Turnstile nicht geladen, neue Sitzungen und Spielaktionen brauchen kein CAPTCHA.
  - Sitzungslimit: die 11. Erstellung wird abgelehnt, bei 15 gleichzeitigen Erstellungen gelingen genau 10 (Backend-Tests). Die Meldung im Browser ist verständlich.
- **Website und Upload:**
  - HTML und öffentliche Dateien wie erwartet.
  - Raumkarten, Anmeldung und Spielstart im Browser geprüft.
  - Nur `public/**` und `vercel.json` hochgeladen.
  - Die geheimen Pfade unter `supabase/functions/_shared/raeume/` sind nicht erreichbar.
- **Zwei berechtigte Personen auf unterschiedlichen Geräten:** Sitzung erstellen, per Code beitreten, gemeinsam spielen, nach dem Neuladen weiterspielen.
- **Weitere Prüfungen aus Meilenstein 1, online:**
  - Die beigetretene Person kann nicht starten.
  - Gemeinsamer Fortschritt.
  - Eine unabhängige dritte Sitzung (zweites Browserprofil der Nutzerin, eigener Gast) bekommt nichts mit und hat keinen Zugriff auf die erste.
  - Gleichzeitiger Tipp ergibt 1 Strafe.
  - Zeitablauf bei geschlossenen Fenstern stellt der Server fest (Startzeit nur im Test-Projekt vorgespult).
  - Verlassen durch die erstellende Person beendet die Sitzung.
- **Deployment:**
  - Alle Jobs nutzen denselben Commit.
  - Ein zweites Auslösen während eines laufenden Deployments startet nicht parallel und bricht das laufende nicht ab.
  - Ein Push auf `main` erzeugt kein Deployment.
  - Die CI läuft ohne Cloud-Zugriff.
  - Der Bypass erscheint in keinem Protokoll.
- **Nichts Öffentliches:** keine öffentliche Version, kein zweites Supabase-Projekt, kein kostenpflichtiger Tarif.

## 9. Aktualisierungen im ursprünglichen Plan (`docs/plaene/2026-10-22_mehrspieler-grundlage.md`)
Nur ergänzende, datierte Hinweise. Der ursprüngliche Text bleibt lesbar, die Protokolleinträge bleiben unverändert.
- Ganz oben und in der AP-5-Zeile der Tabelle: „Aktualisiert am 2026-10-23: AP 5 ist durch den Detailplan `2026-10-23_ap5-testumgebung.md` konkretisiert.“
- Überholte Angaben jeweils mit Hinweis „(aktualisiert 2026-10-23: …)“ korrigieren:
  - „Meilenstein 1 auf echten Geräten über die **öffentliche Adresse**“ wird zu „über die **geschützte Test-Hauptadresse**“. Die öffentliche Version kommt erst nach Freigabe.
  - „Vercel-Konto anlegen und **mit dem Repo verbinden**“ / „Git-Deployments aus“ wird zu „Vercel-Projekt **ohne Git-Verbindung**, Deployment nur per CLI aus dem Workflow, `git.deploymentEnabled: false` zusätzlich“.
  - „Supabase-Konto und **-Projekt**“ wird zu „zunächst nur das **Test-Projekt**, das öffentliche Projekt erst nach Freigabe“.
  - „Vor AP 5 wird ein manuell ausgelöster Deployment-Workflow konkretisiert“ wird zu „konkretisiert am 2026-10-23 (Option C)“.

## Offen [O]
- Freischaltung der externen Person bei wiederholten CLI-Deployments: wird getestet, Ausweichmöglichkeiten nur mit Zustimmung.
- GitHub Pro: Erst nach bestätigter Aktivierung prüfen, ob die Secrets in Environments `test` (nur `main`) bzw. später `oeffentlich` umziehen. Freigaben durch Prüfende gibt es bei privaten Repos auch mit Pro nicht. Die Freigabe der Veröffentlichung bleibt eine ausdrückliche Entscheidung der Nutzerin.
- Vor der öffentlichen Freigabe: zusätzliche Aktionslimits prüfen (gemeinsame Supabase-Kontingente), beendete Sitzungen aufräumen.
- Gültigkeit der Tokens (Vorschlag: bis Semesterende).

## 10. Dokumentation nach Freigabe (laut CLAUDE.md, direkt auf `main`)
1. Diesen Plan als `docs/plaene/2026-10-23_ap5-testumgebung.md` speichern (Datum per `date`) und die Hinweise aus Abschnitt 9 im ursprünglichen Plan ergänzen.
2. Planungseintrag „Planung: AP 5 – Geschützte Testversion und Deployment per Knopf (Detailplanung)“ anlegen:
   - **Auslöser:** Unsicherheit „manuell über Delivery oder automatisiertes Deployment“, die Ergänzungen der Nutzerin zu Testversion, Zugriffsschutz und getrennter öffentlicher Version sowie die sechs Präzisierungspunkte, möglichst im Wortlaut
   - **Rückfragen und Antworten:** Option C, Hobby mit Vercel-Login, GitHub Free
   - **Gründe der Präzisierungen, erste Runde:**
     - Nachvollziehbarkeit als Konkretisierung von AP 5
     - klare Trennung von Test und Veröffentlichung
     - Hostname-Zuordnung ist kein Zugriffsschutz
     - eindeutige Rauchtests statt „irgendein Fehler“
     - Missbrauchsschutz ohne Sonderregeln für zwei Personen
     - Fehlerfälle und Wiederholbarkeit
   - **Änderungswünsche der zweiten Runde und ihre Gründe:**
     - Sitzungslimit auch bei parallelen Anfragen: Ein Limit, das parallel umgangen werden kann, schützt nicht. Dazu Test und verständliche Meldung.
     - Verbleibendes Risiko durch Spielaktionen ausdrücklich benannt, weil gemeinsame Kontingente andere beeinträchtigen können. Aktionslimits sind ein Prüfpunkt vor der Veröffentlichung.
     - CAPTCHA: Unsicherheit entfernt, weil Supabase Turnstile für Gastanmeldungen dokumentiert. Zusätzlich geprüft werden fehlende und ungültige Tokens sowie ein erneuter Versuch mit frischem Token. Kein CAPTCHA pro Aktion.
     - Website-Prüfung getrennt nach HTML-Abruf und Browser, weil die Raumkarten erst durch JavaScript entstehen. Dazu Upload-Auswahl und die tatsächlichen geheimen Pfade.
     - Deployment-Warteschlange korrekt beschrieben: Laufende Deployments sind geschützt, wartende werden nicht alle erhalten. Das reicht für das Projekt.
     - Einordnung der Pipeline: automatische CI plus manueller Deployment-Workflow, der die bestehenden Tests nutzt und nur die geschützte Testversion bereitstellt.
   - **Letzte Präzisierungen (dritte Runde) und ihre Gründe:**
     - Backend-Test: geprüft wird die Ablehnung wegen fehlender Authentifizierung bei gültigem Publishable Key. Wie ein ungültiger Schlüssel beantwortet wird, ist nicht festgelegt und wird deshalb nicht vorausgesetzt.
     - CAPTCHA nur bei tatsächlich nötiger Gastanmeldung laden, eine gültige Anmeldung weiterverwenden. So entsteht keine unnötige Hürde für neue Sitzungen und Spielaktionen.
     - CAPTCHA-Ablauftest als einmaliger Entwicklungstest mit tatsächlich erzeugtem Token, wiederholt bei Änderungen an der Anmeldelogik. So ist der Wiederholungsweg belegt, ohne Spielende oder jedes Deployment zu belasten.
     - Sitzungslimit mit der Begrenzung massenhaft erstellter Sitzungen begründet. Die Aussage „nur dort entstehen viele Zeilen“ war falsch, weil auch die Aktionen-Tabelle wächst.
   - **Abwägung zum Backend-Schutz** (Abschnitt 4)
   - Kurzfassung, Link zur Plandatei
   - **Verworfen:**
     - automatisches Deployment, Deployment vom Laptop
     - Vorschau-Deployments, Vercels Git-Automatik
     - Shareable Links, Passwortschutz (nicht im Hobby-Tarif), Pro-Tarif
     - Beschränkung des Backends auf zwei Personen
     - CAPTCHA nur im Browser
     - Übernahme der lokalen Limits, `supabase config push`
     - automatisches Zurücksetzen der Datenbank
     - zusätzliche Infrastruktur für Begrenzungen
   - Merge von PR #4 (`f14e835`) mit erwähnen
3. **Abschnitt 3:**
   - Deployment-Ablauf C
   - zwei Umgebungen, Veröffentlichung nur nach Freigabe
   - Zugriffsschutz: Hobby, „All Deployments“, zwei eigene Vercel-Konten, kein kostenpflichtiger Tarif ohne Zustimmung
   - Hostname-Zuordnung, nur über die Hauptadresse spielen
   - präzise Rauchtests, Bypass nur als Secret
   - Missbrauchsschutz: Turnstile mit Prüfung durch Supabase, Cloud-Limit 30 pro Stunde, Sitzungslimit, verbleibende Risiken
   - Deployment-Regeln: festgehaltener Commit, kein Abbrechen, kein automatisches Zurücksetzen, Verträglichkeit, Checkliste vor Tests
   - Repository-Secrets bei GitHub Free
4. Abschnitt 2 und `docs/ideen.md`: die offene Frage zum Deployment-Workflow als entschieden markieren, offene Punkte ergänzen.
5. Commit „Doku: Planung zu AP 5 Testversion und Deployment“ und Push. Danach deine Einrichtungsschritte.
