-- ═══════════════════════════════════════════════════════════════
-- ORDERIX — WIPE TOTAL (⚠ IRRÉVERSIBLE)
-- Remet la base à zéro : tous les comptes, pseudos, scores, ligues,
-- groupes d'amies et événements analytics sont effacés.
-- La structure (tables, fonctions, droits) reste intacte, ainsi que
-- day_config (configuration des jours, pas des données joueuses).
-- À exécuter dans le SQL Editor du projet concerné.
-- ═══════════════════════════════════════════════════════════════

-- 1. Tous les comptes → cascade sur profiles, results, league_members,
--    friend_members (les FK sont en on delete cascade)
delete from auth.users;

-- 2. Ce que la cascade ne couvre pas (liens en "set null")
truncate public.analytics_events restart identity;
delete from public.friend_groups;
delete from public.league_groups;

-- 3. Ceintures et bretelles (déjà vidés par la cascade en principe)
delete from public.results;
delete from public.profiles;

-- Vérification : tout doit être à zéro
select 'comptes' as t, count(*) from auth.users
union all select 'profils', count(*) from public.profiles
union all select 'resultats', count(*) from public.results
union all select 'groupes_ligue', count(*) from public.league_groups
union all select 'groupes_amies', count(*) from public.friend_groups
union all select 'evenements', count(*) from public.analytics_events;
