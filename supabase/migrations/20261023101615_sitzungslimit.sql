-- Begrenzung massenhaft erstellter Spielsitzungen (AP 5, Detailplan Abschnitt 4).
-- Ein Gast darf höchstens 10 Sitzungen pro Stunde erstellen – auch bei gleichzeitigen Anfragen.
--
-- Verträglich mit der vorherigen Website: Die Funktion behält Namen, Eingaben und Rückgabe
-- (die neue Sitzung als JSON). Neu ist nur die Antwort { "fehler": "zu_viele_sitzungen" }.

create or replace function public.erstelle_sitzung(p_raum_id text, p_raum_version integer, p_erstellt_von uuid, p_zustand jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  max_pro_stunde constant integer := 10;
  -- 6 Zeichen ohne leicht verwechselbare (kein 0/O, 1/I)
  zeichen constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  zufall bytea;
  code text;
  neue public.sitzungen;
begin
  -- Sperre pro Gast bis zum Ende der Transaktion: Gleichzeitige Anfragen desselben Gastes laufen
  -- nacheinander, damit Zählen und Anlegen das Limit nicht gemeinsam überschreiten können.
  -- Andere Gäste haben eine andere Sperre und werden nicht aufgehalten.
  perform pg_advisory_xact_lock(hashtextextended('erstelle_sitzung:' || p_erstellt_von::text, 0));

  if (select count(*) from public.sitzungen
      where erstellt_von = p_erstellt_von and erstellt_am > now() - interval '1 hour') >= max_pro_stunde then
    return jsonb_build_object('fehler', 'zu_viele_sitzungen');
  end if;

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

-- Rechte ausdrücklich erneut setzen: nur das Backend (service_role) darf die Funktion aufrufen.
revoke execute on function public.erstelle_sitzung(text, integer, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.erstelle_sitzung(text, integer, uuid, jsonb) to service_role;
