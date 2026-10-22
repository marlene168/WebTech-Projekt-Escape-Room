-- Spielsitzungen für den Mehrspieler-Modus (AP 3, Plan „Mehrspieler-Grundlage“).
--
-- Grundsatz: Der Browser darf Sitzungen nur LESEN (und nur die eigenen). Geschrieben wird
-- ausschließlich über die Edge Functions, die dafür die Datenbankfunktionen unten aufrufen.

-- ---------- Tabellen ----------

-- Eine Sitzung = ein Spiel einer Gruppe in einer Raumvorlage. Der Spielstand ist ein JSON-Dokument
-- (wie erstelleSpielstand() in shared/spiel-logik.js); "version" steigt bei jeder Änderung.
create table public.sitzungen (
  id uuid primary key default gen_random_uuid(),
  raum_id text not null,
  raum_version integer not null,
  beitrittscode text not null unique,
  erstellt_von uuid not null references auth.users (id) on delete cascade,
  zustand jsonb not null,
  version integer not null default 1,
  erstellt_am timestamptz not null default now(),
  aktualisiert_am timestamptz not null default now()
);

-- clock_timestamp() statt now(): der echte Zeitpunkt des Eintrags (auch nach dem Warten auf eine Sperre),
-- damit sich die Reihenfolge von Beitritt und Spielstart nachprüfen lässt.
create table public.sitzung_mitglieder (
  sitzung_id uuid not null references public.sitzungen (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  beigetreten_am timestamptz not null default clock_timestamp(),
  primary key (sitzung_id, user_id)
);

-- Verarbeitete Aktionen: verhindern, dass eine doppelt gesendete Aktion zweimal wirkt.
create table public.aktionen (
  sitzung_id uuid not null references public.sitzungen (id) on delete cascade,
  aktion_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  typ text not null,
  daten jsonb not null,
  erstellt_am timestamptz not null default clock_timestamp(),
  primary key (sitzung_id, aktion_id)
);

-- ---------- Zugriffsrechte (Browser: nur lesen) ----------

alter table public.sitzungen enable row level security;
alter table public.sitzung_mitglieder enable row level security;
alter table public.aktionen enable row level security;

revoke all on table public.sitzungen, public.sitzung_mitglieder, public.aktionen from anon, authenticated;
grant select on table public.sitzungen, public.sitzung_mitglieder to authenticated;

-- Ist die angemeldete Person Mitglied der Sitzung? "security definer", damit die Regel für
-- sitzung_mitglieder sich nicht selbst aufruft.
create function public.ist_mitglied(p_sitzung uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.sitzung_mitglieder
    where sitzung_id = p_sitzung and user_id = (select auth.uid())
  );
$$;

revoke execute on function public.ist_mitglied(uuid) from public, anon;
grant execute on function public.ist_mitglied(uuid) to authenticated;

create policy "Mitglieder lesen ihre Sitzung"
  on public.sitzungen for select to authenticated
  using (public.ist_mitglied(id));

create policy "Mitglieder sehen die Mitglieder ihrer Sitzung"
  on public.sitzung_mitglieder for select to authenticated
  using (public.ist_mitglied(sitzung_id));

-- aktionen: keine Regel → für Browser weder lesbar noch schreibbar.

-- Realtime meldet Änderungen an Sitzungen und Mitgliedern (die Regeln oben gelten auch hier).
alter publication supabase_realtime add table public.sitzungen, public.sitzung_mitglieder;

-- ---------- Schreibende Funktionen (nur für das Backend) ----------
-- Jede Funktion läuft als eine Transaktion: Sie gelingt ganz oder wird ganz zurückgenommen.

-- Neue Sitzung mit eindeutigem Beitrittscode; die erstellende Person wird Mitglied.
create function public.erstelle_sitzung(p_raum_id text, p_raum_version integer, p_erstellt_von uuid, p_zustand jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  -- 6 Zeichen ohne leicht verwechselbare (kein 0/O, 1/I)
  zeichen constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  zufall bytea;
  code text;
  neue public.sitzungen;
begin
  loop
    zufall := uuid_send(gen_random_uuid()); -- die ersten 6 Bytes einer UUID v4 sind zufällig
    code := '';
    for i in 0..5 loop
      code := code || substr(zeichen, 1 + get_byte(zufall, i) % 32, 1);
    end loop;
    begin
      insert into public.sitzungen (raum_id, raum_version, beitrittscode, erstellt_von, zustand)
      values (p_raum_id, p_raum_version, code, p_erstellt_von, p_zustand)
      returning * into neue;
      exit;
    exception when unique_violation then
      -- Code schon vergeben: einen neuen erzeugen
    end;
  end loop;

  insert into public.sitzung_mitglieder (sitzung_id, user_id) values (neue.id, p_erstellt_von);
  return to_jsonb(neue);
end;
$$;

-- Beitritt per Code. Neue Mitglieder nur im Status "bereit" und nur bis p_max Personen;
-- wer schon Mitglied ist, kommt jederzeit wieder hinein (Neuladen, Verbindungsabbruch).
create function public.tritt_bei(p_code text, p_user uuid, p_max integer)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  s public.sitzungen;
begin
  -- Sperrt die Sitzungszeile bis zum Ende der Transaktion. Gleichzeitige Beitritte und der
  -- Spielstart (der dieselbe Zeile ändert) laufen dadurch nacheinander ab.
  select * into s from public.sitzungen where beitrittscode = p_code for update;
  if not found then
    return jsonb_build_object('ergebnis', 'unbekannter_code');
  end if;

  if exists (select 1 from public.sitzung_mitglieder where sitzung_id = s.id and user_id = p_user) then
    return jsonb_build_object('ergebnis', 'schon_mitglied', 'sitzung_id', s.id);
  end if;

  if s.zustand ->> 'status' <> 'bereit' then
    return jsonb_build_object('ergebnis', 'schon_gestartet');
  end if;

  if (select count(*) from public.sitzung_mitglieder where sitzung_id = s.id) >= p_max then
    return jsonb_build_object('ergebnis', 'voll');
  end if;

  insert into public.sitzung_mitglieder (sitzung_id, user_id) values (s.id, p_user);
  return jsonb_build_object('ergebnis', 'beigetreten', 'sitzung_id', s.id);
end;
$$;

-- Speichert eine Aktion und den neuen Spielstand gemeinsam.
--   schon_verarbeitet: diese aktion_id gab es schon → nichts ändern, aktuellen Stand melden
--   versionskonflikt:  jemand anderes war schneller → nichts geändert, das Backend rechnet neu
--   gespeichert:       Spielstand und Aktionseintrag sind gespeichert
-- Scheitert der Aktionseintrag, wird auch die Änderung am Spielstand zurückgenommen.
create function public.speichere_aktion(
  p_sitzung uuid, p_aktion_id uuid, p_user uuid, p_typ text, p_daten jsonb,
  p_erwartete_version integer, p_neuer_zustand jsonb
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  s public.sitzungen;
begin
  if exists (select 1 from public.aktionen where sitzung_id = p_sitzung and aktion_id = p_aktion_id) then
    select * into s from public.sitzungen where id = p_sitzung;
    return jsonb_build_object('ergebnis', 'schon_verarbeitet', 'sitzung', to_jsonb(s));
  end if;

  update public.sitzungen
  set zustand = p_neuer_zustand, version = version + 1, aktualisiert_am = now()
  where id = p_sitzung and version = p_erwartete_version
  returning * into s;
  if not found then
    return jsonb_build_object('ergebnis', 'versionskonflikt');
  end if;

  insert into public.aktionen (sitzung_id, aktion_id, user_id, typ, daten)
  values (p_sitzung, p_aktion_id, p_user, p_typ, p_daten);

  return jsonb_build_object('ergebnis', 'gespeichert', 'sitzung', to_jsonb(s));
end;
$$;

-- Speichert eine vom Server erkannte Änderung ohne Aktion (z. B. Zeit abgelaufen).
-- Gibt die aktualisierte Sitzung zurück oder null, wenn die Version nicht mehr stimmt.
create function public.speichere_zustand(p_sitzung uuid, p_erwartete_version integer, p_neuer_zustand jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  s public.sitzungen;
begin
  update public.sitzungen
  set zustand = p_neuer_zustand, version = version + 1, aktualisiert_am = now()
  where id = p_sitzung and version = p_erwartete_version
  returning * into s;
  if not found then
    return null;
  end if;
  return to_jsonb(s);
end;
$$;

-- Nur das Backend (service_role) darf die schreibenden Funktionen aufrufen.
revoke execute on function public.erstelle_sitzung(text, integer, uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.tritt_bei(text, uuid, integer) from public, anon, authenticated;
revoke execute on function public.speichere_aktion(uuid, uuid, uuid, text, jsonb, integer, jsonb) from public, anon, authenticated;
revoke execute on function public.speichere_zustand(uuid, integer, jsonb) from public, anon, authenticated;
grant execute on function public.erstelle_sitzung(text, integer, uuid, jsonb) to service_role;
grant execute on function public.tritt_bei(text, uuid, integer) to service_role;
grant execute on function public.speichere_aktion(uuid, uuid, uuid, text, jsonb, integer, jsonb) to service_role;
grant execute on function public.speichere_zustand(uuid, integer, jsonb) to service_role;
