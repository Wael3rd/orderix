-- ═══════════════════════════════════════════════════════════════
-- ORDERIX — Migration 0002 : RGPD (suppression de compte) + Ligue
-- hebdomadaire. À exécuter après 0001_init.sql.
-- ═══════════════════════════════════════════════════════════════

-- ─── RGPD art. 17 : suppression de son propre compte ─────────────
-- Efface l'utilisateur auth ; les cascades (profiles, results,
-- league_members) nettoient tout le reste. Irréversible.
create or replace function public.delete_my_account()
returns void
language plpgsql security definer set search_path = public
as $$
begin
    if auth.uid() is null then
        raise exception 'authentification requise';
    end if;
    delete from auth.users where id = auth.uid();
end;
$$;

-- ─── Ligue hebdomadaire ──────────────────────────────────────────
-- Groupes de 30 joueuses max, remplis dans l'ordre d'arrivée chaque
-- semaine ISO. Classement : victoires de la semaine, départagées au
-- temps total. v1 sans promotion/relégation (notée pour la v2).

create table public.league_groups (
    id         uuid primary key default gen_random_uuid(),
    week       int  not null,
    created_at timestamptz not null default now()
);
create index league_groups_week_idx on public.league_groups (week, created_at);

create table public.league_members (
    week      int  not null,
    group_id  uuid not null references public.league_groups (id) on delete cascade,
    user_id   uuid not null references auth.users (id) on delete cascade,
    joined_at timestamptz not null default now(),
    primary key (week, user_id)
);
create index league_members_group_idx on public.league_members (group_id);

-- Tables verrouillées : tout passe par les fonctions ci-dessous
alter table public.league_groups  enable row level security;
alter table public.league_members enable row level security;

create or replace function public.current_iso_week()
returns int language sql stable
as $$ select to_char(now() at time zone 'utc', 'IYYYIW')::int $$;

-- Rejoint (ou retrouve) sa ligue de la semaine. Renvoie le group_id.
create or replace function public.join_league()
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
    v_week int := public.current_iso_week();
    v_group uuid;
begin
    if auth.uid() is null then
        raise exception 'authentification requise';
    end if;
    select group_id into v_group
      from league_members where week = v_week and user_id = auth.uid();
    if v_group is not null then return v_group; end if;

    -- Premier groupe de la semaine encore ouvert (< 30 membres)
    select g.id into v_group
      from league_groups g
      join lateral (select count(*) n from league_members m where m.group_id = g.id) c on true
     where g.week = v_week and c.n < 30
     order by g.created_at
     limit 1;

    if v_group is null then
        insert into league_groups (week) values (v_week) returning id into v_group;
    end if;

    insert into league_members (week, group_id, user_id)
    values (v_week, v_group, auth.uid())
    on conflict do nothing;
    return v_group;
end;
$$;

-- Classement de MA ligue : victoires de la semaine (heure UTC),
-- départage au temps total. Les joueuses sans pseudo restent anonymes.
create or replace function public.get_league()
returns table (pseudo text, wins int, total_time_ms bigint, is_me boolean)
language sql security definer set search_path = public stable
as $$
    with mine as (
        select group_id from league_members
        where week = public.current_iso_week() and user_id = auth.uid()
    )
    select
        coalesce(pr.pseudo::text, 'Invitée'),
        count(r.*)::int                       as wins,
        coalesce(sum(r.time_ms), 0)::bigint   as total_time_ms,
        (lm.user_id = auth.uid())             as is_me
    from league_members lm
    left join profiles pr on pr.id = lm.user_id
    left join results r
           on r.user_id = lm.user_id
          and r.status = 'win'
          and r.created_at >= date_trunc('week', now() at time zone 'utc')
    where lm.group_id = (select group_id from mine)
      and lm.week = public.current_iso_week()
    group by lm.user_id, pr.pseudo
    order by wins desc, total_time_ms asc, pseudo nulls last;
$$;

-- ─── Droits ──────────────────────────────────────────────────────
revoke execute on function public.delete_my_account() from public;
revoke execute on function public.join_league()       from public;
revoke execute on function public.get_league()        from public;
grant  execute on function public.delete_my_account() to authenticated;
grant  execute on function public.join_league()       to authenticated;
grant  execute on function public.get_league()        to authenticated;
grant  execute on function public.current_iso_week()  to anon, authenticated;
