-- ═══════════════════════════════════════════════════════════════
-- ORDERIX — Schéma initial (staging & prod)
-- Principes : pseudonymisation par construction (aucune PII ici,
-- l'e-mail vit uniquement dans auth.users), RLS partout, une seule
-- tentative par puzzle garantie par la base, suppression en cascade
-- (RGPD art. 17 : supprimer le compte auth efface tout).
-- ═══════════════════════════════════════════════════════════════

create extension if not exists citext;

-- ─── Profils publics ─────────────────────────────────────────────
-- Une ligne par utilisateur (y compris anonymes). Le pseudo est la
-- seule donnée visible publiquement, et il est optionnel.
create table public.profiles (
    id         uuid primary key references auth.users (id) on delete cascade,
    pseudo     citext unique check (char_length(pseudo) between 3 and 15),
    created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_all" on public.profiles
    for select using (true);
create policy "profiles_insert_own" on public.profiles
    for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
    for update using (auth.uid() = id);

-- ─── Résultats de puzzles ────────────────────────────────────────
create type public.result_status as enum ('win', 'fail', 'abandon');

create table public.results (
    user_id    uuid not null references auth.users (id) on delete cascade,
    year       int  not null check (year between 2026 and 2100),
    day        int  not null check (day between 1 and 365),
    status     public.result_status not null,
    time_ms    int  not null check (time_ms >= 0),
    item_count int  not null default 10 check (item_count between 1 and 100),
    feedback   text check (feedback in ('like', 'dislike')),
    shared     boolean not null default false,
    created_at timestamptz not null default now(),
    -- Règle d'or du jeu : une seule tentative par jour, garantie par la base
    primary key (user_id, year, day)
);

alter table public.results enable row level security;

create policy "results_select_own" on public.results
    for select using (auth.uid() = user_id);
-- Pas de policy INSERT/UPDATE : tout passe par les fonctions
-- submit_score() / set_feedback() qui portent les validations.

create index results_leaderboard_idx
    on public.results (year, day, item_count, status, time_ms);

-- ─── Config des jours (remplace l'onglet Google Sheets) ──────────
create table public.day_config (
    day        int primary key check (day between 1 and 365),
    item_count int check (item_count between 1 and 100),
    mode_id    text,
    type       text,
    enabled    boolean not null default true
);

alter table public.day_config enable row level security;
create policy "day_config_select_all" on public.day_config
    for select using (true);

-- ─── Soumission de score (garde-fous anti-triche basiques) ───────
-- La triche console reste possible côté client, mais on élimine :
-- temps impossibles, jours futurs, secondes tentatives, usurpation d'UID.
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
    values (auth.uid(), p_year, p_day, p_status, p_time_ms, p_item_count);
    -- la clé primaire (user_id, year, day) rejette toute seconde tentative
end;
$$;

-- ─── Avis et partage (mise à jour de sa propre ligne uniquement) ─
create or replace function public.set_feedback(
    p_year int, p_day int, p_feedback text, p_shared boolean
) returns void
language plpgsql security definer set search_path = public
as $$
begin
    if auth.uid() is null then
        raise exception 'authentification requise';
    end if;
    update results
       set feedback = coalesce(p_feedback, feedback),
           shared   = shared or coalesce(p_shared, false)
     where user_id = auth.uid() and year = p_year and day = p_day;
end;
$$;

-- ─── Classement public d'un jour ─────────────────────────────────
-- Expose uniquement pseudo + temps des victoires : aucune PII,
-- les joueuses sans pseudo n'apparaissent pas.
create or replace function public.get_leaderboard(
    p_year int, p_day int, p_item_count int, p_limit int default 10
) returns table (pseudo citext, time_ms int)
language sql security definer set search_path = public stable
as $$
    select pr.pseudo, r.time_ms
    from results r
    join profiles pr on pr.id = r.user_id
    where r.year = p_year and r.day = p_day
      and r.item_count = p_item_count
      and r.status = 'win'
      and pr.pseudo is not null
    order by r.time_ms asc
    limit least(coalesce(p_limit, 10), 50);
$$;

-- ─── Export RGPD (art. 20 : portabilité) ─────────────────────────
create or replace function public.export_my_data()
returns jsonb
language sql security definer set search_path = public stable
as $$
    select jsonb_build_object(
        'profile', (select to_jsonb(p) from profiles p where p.id = auth.uid()),
        'results', (select coalesce(jsonb_agg(to_jsonb(r) - 'user_id'), '[]'::jsonb)
                    from results r where r.user_id = auth.uid())
    );
$$;

-- ─── Droits d'exécution ──────────────────────────────────────────
revoke execute on all functions in schema public from public;
grant execute on function public.submit_score      to authenticated;
grant execute on function public.set_feedback      to authenticated;
grant execute on function public.export_my_data    to authenticated;
grant execute on function public.get_leaderboard   to anon, authenticated;
