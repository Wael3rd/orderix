-- ═══════════════════════════════════════════════════════════════
-- ORDERIX — Migration 0005 : le classement affiche TOUT LE MONDE.
-- Sans pseudo, la joueuse apparaît en « Invitée-xxxx » (identifiant
-- pseudonyme court, aucune PII). La ligne de la joueuse connectée est
-- marquée is_me. À exécuter après 0004_ligue_v2_stats.sql.
-- ═══════════════════════════════════════════════════════════════

-- Changement de signature → drop obligatoire
drop function if exists public.get_leaderboard(int, int, int, int);
create function public.get_leaderboard(
    p_year int, p_day int, p_item_count int, p_limit int default 10
) returns table (pseudo text, time_ms int, is_me boolean)
language sql security definer set search_path = public stable
as $$
    select
        coalesce(pr.pseudo::text, 'Invitée-' || left(r.user_id::text, 4)),
        r.time_ms,
        (auth.uid() is not null and r.user_id = auth.uid())
    from results r
    left join profiles pr on pr.id = r.user_id
    where r.year = p_year and r.day = p_day
      and r.item_count = p_item_count
      and r.status = 'win'
    order by r.time_ms asc
    limit least(coalesce(p_limit, 10), 50);
$$;

revoke execute on function public.get_leaderboard(int, int, int, int) from public;
grant  execute on function public.get_leaderboard(int, int, int, int) to anon, authenticated;
