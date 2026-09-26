-- ═══════════════════════════════════════════════════════════════
-- KITKAT FIGHTERS : stockage des avis de la famille
-- Hors projet Orderix : deux tables isolées, sans lien avec le jeu.
-- À coller une fois dans le SQL Editor du projet orderix-staging, puis "Run".
-- Le script peut être relancé sans risque (il ne supprime rien).
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.kitkat_votes (
    kitkat      text        not null check (char_length(kitkat) between 1 and 40),
    player      smallint    not null check (player between 0 and 3),
    taste       smallint    not null default 0 check (taste between 0 and 3),   -- 0 rien, 1 mauvais, 2 moyen, 3 bon
    weird       smallint    not null default 0 check (weird between 0 and 3),   -- 0 rien, 1 non, 2 un peu, 3 trop
    updated_at  timestamptz not null default now(),
    primary key (kitkat, player)
);

create table if not exists public.kitkat_players (
    player      smallint    primary key check (player between 0 and 3),
    name        text        not null check (char_length(name) between 1 and 16),
    updated_at  timestamptz not null default now()
);

insert into public.kitkat_players (player, name) values
    (0, 'Wael'), (1, 'Aline'), (2, 'Ismael'), (3, 'Adel')
on conflict (player) do nothing;

alter table public.kitkat_votes   enable row level security;
alter table public.kitkat_players enable row level security;

drop policy if exists "kk_votes_read"   on public.kitkat_votes;
drop policy if exists "kk_votes_insert" on public.kitkat_votes;
drop policy if exists "kk_votes_update" on public.kitkat_votes;
create policy "kk_votes_read"   on public.kitkat_votes for select to anon, authenticated using (true);
create policy "kk_votes_insert" on public.kitkat_votes for insert to anon, authenticated with check (true);
create policy "kk_votes_update" on public.kitkat_votes for update to anon, authenticated using (true) with check (true);

drop policy if exists "kk_players_read"   on public.kitkat_players;
drop policy if exists "kk_players_insert" on public.kitkat_players;
drop policy if exists "kk_players_update" on public.kitkat_players;
create policy "kk_players_read"   on public.kitkat_players for select to anon, authenticated using (true);
create policy "kk_players_insert" on public.kitkat_players for insert to anon, authenticated with check (true);
create policy "kk_players_update" on public.kitkat_players for update to anon, authenticated using (true) with check (true);

grant select, insert, update on public.kitkat_votes   to anon, authenticated;
grant select, insert, update on public.kitkat_players to anon, authenticated;

-- Vérification
select 'joueurs' as t, count(*) from public.kitkat_players
union all select 'avis', count(*) from public.kitkat_votes;
