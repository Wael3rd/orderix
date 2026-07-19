-- ═══════════════════════════════════════════════════════════════
-- ORDERIX — Migration 0003 : classements entre amies (code à
-- partager) + collecteur d'événements analytics pseudonymes.
-- À exécuter après 0002_rgpd_ligue.sql.
-- ═══════════════════════════════════════════════════════════════

-- ─── Groupes d'amies ─────────────────────────────────────────────
create table public.friend_groups (
    id         uuid primary key default gen_random_uuid(),
    code       text unique not null,
    name       text not null check (char_length(name) between 1 and 24),
    created_by uuid references auth.users (id) on delete set null,
    created_at timestamptz not null default now()
);

create table public.friend_members (
    group_id  uuid not null references public.friend_groups (id) on delete cascade,
    user_id   uuid not null references auth.users (id) on delete cascade,
    joined_at timestamptz not null default now(),
    primary key (group_id, user_id)
);

alter table public.friend_groups  enable row level security;
alter table public.friend_members enable row level security;

-- Code lisible sans ambiguïté (pas de O/0, I/1…)
create or replace function public._gen_group_code()
returns text language sql volatile
as $$
    select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789',
        (floor(random() * 31) + 1)::int, 1), '')
    from generate_series(1, 6)
$$;

create or replace function public.create_friend_group(p_name text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
    v_code text;
    v_id uuid;
begin
    if auth.uid() is null then raise exception 'authentification requise'; end if;
    loop
        v_code := public._gen_group_code();
        begin
            insert into friend_groups (code, name, created_by)
            values (v_code, trim(p_name), auth.uid())
            returning id into v_id;
            exit;
        exception when unique_violation then end;
    end loop;
    insert into friend_members (group_id, user_id) values (v_id, auth.uid());
    return jsonb_build_object('code', v_code, 'name', trim(p_name));
end;
$$;

create or replace function public.join_friend_group(p_code text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
    v_id uuid; v_name text; v_n int;
begin
    if auth.uid() is null then raise exception 'authentification requise'; end if;
    select id, name into v_id, v_name
      from friend_groups where code = upper(trim(p_code));
    if v_id is null then raise exception 'code inconnu'; end if;
    select count(*) into v_n from friend_members where group_id = v_id;
    if v_n >= 30 then raise exception 'groupe complet'; end if;
    insert into friend_members (group_id, user_id)
    values (v_id, auth.uid()) on conflict do nothing;
    return jsonb_build_object('code', upper(trim(p_code)), 'name', v_name);
end;
$$;

create or replace function public.leave_friend_group(p_code text)
returns void
language sql security definer set search_path = public
as $$
    delete from friend_members m
     using friend_groups g
     where g.id = m.group_id and g.code = upper(trim(p_code))
       and m.user_id = auth.uid();
$$;

-- Tous MES groupes avec le classement de la semaine de chacun
create or replace function public.get_friend_boards()
returns table (code text, name text, pseudo text, wins int, total_time_ms bigint, is_me boolean)
language sql security definer set search_path = public stable
as $$
    select
        g.code, g.name,
        coalesce(pr.pseudo::text, 'Invitée'),
        count(r.*)::int,
        coalesce(sum(r.time_ms), 0)::bigint,
        (fm.user_id = auth.uid())
    from friend_members me
    join friend_groups g on g.id = me.group_id
    join friend_members fm on fm.group_id = g.id
    left join profiles pr on pr.id = fm.user_id
    left join results r
           on r.user_id = fm.user_id
          and r.status = 'win'
          and r.created_at >= date_trunc('week', now() at time zone 'utc')
    where me.user_id = auth.uid()
    group by g.code, g.name, fm.user_id, pr.pseudo
    order by g.name, count(r.*) desc, coalesce(sum(r.time_ms), 0) asc;
$$;

-- ─── Analytics pseudonymes (insert-only, jamais lisibles du client) ─
create table public.analytics_events (
    id          bigint generated always as identity primary key,
    user_id     uuid references auth.users (id) on delete set null,
    client_t    timestamptz,
    n           text not null check (char_length(n) <= 40),
    p           jsonb not null default '{}',
    received_at timestamptz not null default now()
);
create index analytics_events_n_idx on public.analytics_events (n, received_at);

alter table public.analytics_events enable row level security;

-- Réception par lots (max 100), horodatage client conservé
create or replace function public.log_events(p_events jsonb)
returns int
language plpgsql security definer set search_path = public
as $$
declare
    v_n int := 0;
    e jsonb;
begin
    if auth.uid() is null then raise exception 'authentification requise'; end if;
    for e in select * from jsonb_array_elements(p_events) limit 100 loop
        insert into analytics_events (user_id, client_t, n, p)
        values (
            auth.uid(),
            nullif(e->>'t', '')::timestamptz,
            left(e->>'n', 40),
            coalesce(e->'p', '{}'::jsonb)
        );
        v_n := v_n + 1;
    end loop;
    return v_n;
end;
$$;

-- ─── Droits ──────────────────────────────────────────────────────
revoke execute on function public._gen_group_code()          from public;
revoke execute on function public.create_friend_group(text)  from public;
revoke execute on function public.join_friend_group(text)    from public;
revoke execute on function public.leave_friend_group(text)   from public;
revoke execute on function public.get_friend_boards()        from public;
revoke execute on function public.log_events(jsonb)          from public;
grant  execute on function public.create_friend_group(text)  to authenticated;
grant  execute on function public.join_friend_group(text)    to authenticated;
grant  execute on function public.leave_friend_group(text)   to authenticated;
grant  execute on function public.get_friend_boards()        to authenticated;
grant  execute on function public.log_events(jsonb)          to authenticated;
