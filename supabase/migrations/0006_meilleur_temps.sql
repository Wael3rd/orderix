-- ═══════════════════════════════════════════════════════════════
-- ORDERIX — Migration 0006 : le temps du jour devient le MEILLEUR temps.
-- Note du 14/11/2026 (« rejouer pour que ça compte » entre amies) : le jeu
-- Unity vend un nouvel essai du puzzle du jour en pièces. Jusqu'ici la clé
-- primaire (user_id, year, day) rejetait toute seconde soumission : le temps
-- amélioré ne quittait jamais le téléphone.
--
-- Maintenant : une seconde soumission GAGNANTE et PLUS RAPIDE remplace le
-- temps de la ligne du jour ; tout le reste est ignoré sans erreur (temps
-- plus lent ou égal, défaite après une victoire, autre item_count).
-- created_at ne bouge pas : la victoire reste comptée dans sa semaine
-- (get_friend_boards), une seule par jour comme avant.
--
-- À appliquer depuis le dépôt OrderixUnity :
--   python Tools/retours/appliquer_sql.py ..\Orderix\supabase\migrations\0006_meilleur_temps.sql
-- puis ouvrir le nouvel essai dans le jeu (CompeteConfig.DailyRetryOpen = 1,
-- dans le code ou par « Compete.DailyRetryOpen » de Tools/meta/reglages.json).
-- Retour arrière : rejouer la définition de submit_score de 0001_init.sql.
-- ═══════════════════════════════════════════════════════════════

create or replace function public.submit_score(
    p_year int, p_day int, p_status public.result_status,
    p_time_ms int, p_item_count int
) returns void
language plpgsql security definer set search_path = public
as $$
declare
    v_doy int := extract(doy from now() at time zone 'utc')::int;
    v_year int := extract(year from now() at time zone 'utc')::int;
begin
    if auth.uid() is null then
        raise exception 'authentification requise';
    end if;
    -- pas de score pour un jour qui n'a pas encore eu lieu (tolérance ±1 pour les fuseaux)
    if p_year > v_year or (p_year = v_year and p_day > v_doy + 1) then
        raise exception 'jour futur';
    end if;
    -- une victoire en moins de 300 ms n'existe pas sur ces puzzles
    if p_status = 'win' and p_time_ms < 300 then
        raise exception 'temps invraisemblable';
    end if;
    insert into results (user_id, year, day, status, time_ms, item_count)
    values (auth.uid(), p_year, p_day, p_status, p_time_ms, p_item_count)
    on conflict (user_id, year, day) do update
       set time_ms = excluded.time_ms
     where results.status = 'win'
       and excluded.status = 'win'
       and results.item_count = excluded.item_count
       and excluded.time_ms < results.time_ms;
end;
$$;

revoke execute on function public.submit_score(int, int, public.result_status, int, int) from public;
grant  execute on function public.submit_score(int, int, public.result_status, int, int) to authenticated;
