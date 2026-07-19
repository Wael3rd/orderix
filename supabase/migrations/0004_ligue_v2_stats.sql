-- ═══════════════════════════════════════════════════════════════
-- ORDERIX — Migration 0004 : Ligue v2 (divisions + promotion/
-- relégation) et statistiques publiques agrégées (rétention).
-- À exécuter après 0003_amies_analytics.sql.
-- ═══════════════════════════════════════════════════════════════

-- ─── Divisions : 1 = Or, 2 = Argent, 3 = Bronze ──────────────────
alter table public.league_groups
    add column if not exists division int not null default 2
    check (division between 1 and 3);

-- join_league v2 : la division de la semaine découle du classement de
-- la semaine PRÉCÉDENTE — top 5 du groupe = promotion, 5 dernières =
-- relégation, nouvelles arrivantes en Argent.
create or replace function public.join_league()
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
    v_week int := public.current_iso_week();
    v_prev_week int := to_char((now() at time zone 'utc') - interval '7 days', 'IYYYIW')::int;
    v_group uuid;
    v_prev_group uuid;
    v_prev_div int;
    v_rank int;
    v_size int;
    v_div int := 2;
begin
    if auth.uid() is null then
        raise exception 'authentification requise';
    end if;
    select group_id into v_group
      from league_members where week = v_week and user_id = auth.uid();
    if v_group is not null then return v_group; end if;

    -- Résultat de la semaine dernière → division de cette semaine
    select m.group_id, g.division into v_prev_group, v_prev_div
      from league_members m join league_groups g on g.id = m.group_id
     where m.week = v_prev_week and m.user_id = auth.uid();

    if v_prev_group is not null then
        with board as (
            select lm.user_id,
                   count(r.*) as wins,
                   coalesce(sum(r.time_ms), 0) as total_ms
            from league_members lm
            left join results r
                   on r.user_id = lm.user_id and r.status = 'win'
                  and r.created_at >= date_trunc('week', now() at time zone 'utc') - interval '7 days'
                  and r.created_at <  date_trunc('week', now() at time zone 'utc')
            where lm.group_id = v_prev_group
            group by lm.user_id
        ), ranked as (
            select user_id, rank() over (order by wins desc, total_ms asc) rk,
                   count(*) over () sz
            from board
        )
        select rk, sz into v_rank, v_size from ranked where user_id = auth.uid();

        v_div := coalesce(v_prev_div, 2);
        if v_rank is not null and v_size >= 10 then
            if v_rank <= 5 then v_div := greatest(1, v_div - 1);
            elsif v_rank > v_size - 5 then v_div := least(3, v_div + 1);
            end if;
        elsif v_rank is not null and v_size < 10 then
            -- petit groupe : seule la première monte, seule la dernière descend
            if v_rank = 1 then v_div := greatest(1, v_div - 1);
            elsif v_rank = v_size then v_div := least(3, v_div + 1);
            end if;
        end if;
    end if;

    select g.id into v_group
      from league_groups g
      join lateral (select count(*) n from league_members m where m.group_id = g.id) c on true
     where g.week = v_week and g.division = v_div and c.n < 30
     order by g.created_at
     limit 1;

    if v_group is null then
        insert into league_groups (week, division) values (v_week, v_div)
        returning id into v_group;
    end if;

    insert into league_members (week, group_id, user_id)
    values (v_week, v_group, auth.uid())
    on conflict do nothing;
    return v_group;
end;
$$;

-- get_league v2 : expose aussi la division (changement de signature →
-- drop obligatoire avant re-création)
drop function if exists public.get_league();
create function public.get_league()
returns table (division int, pseudo text, wins int, total_time_ms bigint, is_me boolean)
language sql security definer set search_path = public stable
as $$
    with mine as (
        select group_id from league_members
        where week = public.current_iso_week() and user_id = auth.uid()
    )
    select
        g.division,
        coalesce(pr.pseudo::text, 'Invitée'),
        count(r.*)::int,
        coalesce(sum(r.time_ms), 0)::bigint,
        (lm.user_id = auth.uid())
    from league_members lm
    join league_groups g on g.id = lm.group_id
    left join profiles pr on pr.id = lm.user_id
    left join results r
           on r.user_id = lm.user_id
          and r.status = 'win'
          and r.created_at >= date_trunc('week', now() at time zone 'utc')
    where lm.group_id = (select group_id from mine)
      and lm.week = public.current_iso_week()
    group by g.division, lm.user_id, pr.pseudo
    order by count(r.*) desc, coalesce(sum(r.time_ms), 0) asc;
$$;

-- ─── Statistiques publiques AGRÉGÉES (tableau de bord rétention) ─
-- Aucune donnée individuelle : uniquement des comptages. Lisible par
-- tous (la page stats du propriétaire l'utilise avec la clé anon).
create or replace function public.get_public_stats()
returns jsonb
language sql security definer set search_path = public stable
as $$
    select jsonb_build_object(
        'joueuses_total', (select count(distinct user_id) from analytics_events),
        'jours', (
            select coalesce(jsonb_agg(x order by x->>'d'), '[]'::jsonb) from (
                select jsonb_build_object(
                    'd', date_trunc('day', received_at)::date,
                    'dau', count(distinct user_id),
                    'parties', count(*) filter (where n = 'game_result'),
                    'victoires', count(*) filter (where n = 'game_result' and (p->>'win') = 'true'),
                    'partages', count(*) filter (where n in ('partage', 'partage_semaine')),
                    'erreurs', count(*) filter (where n in ('js_error', 'js_promesse_rejetee'))
                ) x
                from analytics_events
                where received_at > now() - interval '30 days'
                group by date_trunc('day', received_at)
            ) t
        ),
        'retention', (
            with firsts as (
                select user_id, min(received_at)::date f
                from analytics_events group by user_id
            ),
            actifs as (
                select distinct user_id, received_at::date d from analytics_events
            )
            select jsonb_build_object(
                'd1_pct', round(100.0 *
                    count(*) filter (where exists (select 1 from actifs a where a.user_id = firsts.user_id and a.d = firsts.f + 1))
                    / nullif(count(*) filter (where firsts.f <= current_date - 1), 0), 1),
                'd7_pct', round(100.0 *
                    count(*) filter (where exists (select 1 from actifs a where a.user_id = firsts.user_id and a.d = firsts.f + 7))
                    / nullif(count(*) filter (where firsts.f <= current_date - 7), 0), 1)
            ) from firsts
        )
    );
$$;

-- ─── Droits ──────────────────────────────────────────────────────
revoke execute on function public.get_league()       from public;
revoke execute on function public.get_public_stats() from public;
grant  execute on function public.join_league()      to authenticated;
grant  execute on function public.get_league()       to authenticated;
grant  execute on function public.get_public_stats() to anon, authenticated;
