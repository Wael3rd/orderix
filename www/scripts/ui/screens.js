// ─── Écrans : navigation, accueil (layout social), calendrier,
//     classement, profil ─────────────────────────────────────────

const SCREENS = {
    home: document.getElementById('screen-home'),
    calendar: document.getElementById('screen-calendar'),
    league: document.getElementById('screen-league'),
    shop: document.getElementById('screen-shop'),
    profile: document.getElementById('screen-profile'),
    game: document.getElementById('screen-game')
};
const tabbar = document.getElementById('tabbar');

let _screenTransitioning = false;
let _pendingTransition = null; // fin de la transition en cours (appelable)
// Position de défilement mémorisée par écran : revenir d'un jeu (ou
// changer d'onglet) ramène exactement là où on était dans la liste.
const _screenScroll = {};

function showScreen(name) {
    // Naviguer PENDANT une transition termine celle-ci immédiatement au
    // lieu d'avaler le tap (double-tap rapide entre onglets)
    if (_pendingTransition) _pendingTransition();
    const prev = currentScreen;
    if (prev !== name) _screenScroll[prev] = window.scrollY || 0;
    currentScreen = name;

    tabbar.classList.toggle('away', name === 'game');
    document.querySelectorAll('#tabbar .tab').forEach(t =>
        t.classList.toggle('active', t.dataset.screen === name));

    const outgoing = SCREENS[prev];
    const incoming = SCREENS[name];

    function showIncoming() {
        Object.keys(SCREENS).forEach(k => {
            SCREENS[k].classList.toggle('hidden', k !== name);
            SCREENS[k].style.animation = '';
        });
        incoming.style.animation = 'none';
        void incoming.offsetWidth;
        incoming.style.animation = '';
        _screenTransitioning = false;

        if (name === 'home') buildHome();
        if (name === 'calendar') buildCalendar();
        if (name === 'league') buildLeague();
        if (name === 'shop') buildShop();
        if (name === 'profile') buildProfile();

        // Restaurer la position APRÈS reconstruction (le contenu doit
        // exister pour que la hauteur permette d'y défiler). L'écran de
        // jeu, lui, démarre toujours en haut.
        window.scrollTo(0, name === 'game' ? 0 : (_screenScroll[name] || 0));
    }

    if (outgoing && outgoing !== incoming && !outgoing.classList.contains('hidden')) {
        // Animer la sortie si le navigateur supporte les animations CSS
        // (jsdom / environnements de test ne les supportent pas → transition immédiate)
        const supportsAnim = typeof outgoing.getAnimations === 'function';
        if (supportsAnim) {
            _screenTransitioning = true;
            outgoing.style.animation = 'screenOut .2s ease-in forwards';
            const done = () => {
                if (_pendingTransition !== done) return; // déjà terminée
                _pendingTransition = null;
                outgoing.style.animation = '';
                showIncoming();
            };
            _pendingTransition = done;
            outgoing.addEventListener('animationend', done, { once: true });
            setTimeout(done, 250);
        } else {
            showIncoming();
        }
    } else {
        showIncoming();
    }
}

// ── ACCUEIL ──────────────────────────────────────────────────────
function buildHome() {
    const now = new Date();
    document.getElementById('home-date').textContent =
        `${WEEKDAY_NAMES[now.getDay()]} ${now.getDate()} ${MONTH_NAMES_FULL[now.getMonth()]}`;

    // HUD joueuse : pseudo, niveau (1 + réussis/10), étoiles (= réussis)
    const stats = computeStats();
    const name = getPlayerName();
    document.getElementById('hud-name').textContent = name || 'Invitée';
    const avatar = currentAvatar();
    document.getElementById('hud-avatar').textContent = avatar || (name ? name[0].toUpperCase() : '☺');
    document.getElementById('hud-level').textContent = 'NIVEAU ' + (1 + Math.floor(stats.stars / 10));
    document.getElementById('hud-stars').textContent = stats.stars;

    const tid = todayDayId();
    const day = DAYS.find(d => d.id === tid) || DAYS[0];

    // Jour vide (après la campagne de test) : carte « pause », pas de bouton Jouer
    if (day.empty) {
        document.getElementById('daily-num').textContent = day.id;
        document.getElementById('daily-mode').textContent = 'Pas de défi ce jour';
        document.getElementById('daily-type').textContent = 'Le calendrier de test couvre janvier, février et début mars.';
        const tiles = document.getElementById('daily-tiles');
        tiles.innerHTML = '';
        const z = document.createElement('div');
        z.className = 'tile t';
        z.textContent = '☾';
        tiles.appendChild(z);
        const act = document.getElementById('daily-action');
        act.innerHTML = '';
        const goCal = document.createElement('button');
        goCal.className = 'btn btn-primary';
        goCal.textContent = 'Ouvrir le calendrier';
        goCal.addEventListener('click', () => showScreen('calendar'));
        act.appendChild(goCal);
        document.getElementById('home-lead-list').innerHTML = '';
        return;
    }

    const mode = GAME_MODES[day.modeId];
    const base = BASE_TYPES.find(b => b.type === day.type);

    document.getElementById('daily-num').textContent = day.id;
    const dailyModeEl = document.getElementById('daily-mode');
    dailyModeEl.textContent = mode.name;
    if (needsTest(day)) {
        const t = document.createElement('span');
        t.className = 'totest';
        t.style.cssText = 'position:static;display:inline-flex;margin-left:8px;vertical-align:middle;';
        t.textContent = '!';
        dailyModeEl.appendChild(t);
    }
    const themeEl = document.getElementById('daily-type');
    themeEl.innerHTML = '';
    if (!mode.typeAgnostic && base) themeEl.appendChild(document.createTextNode('Thème : ' + base.title));
    if (stats.streak > 0) {
        if (themeEl.textContent) themeEl.appendChild(document.createTextNode(' · '));
        const b = document.createElement('b');
        b.innerHTML = `Série : ${stats.streak} ${imgIc('flamme')}`;
        themeEl.appendChild(b);
    }
    if (stats.freezes > 0) {
        if (themeEl.textContent) themeEl.appendChild(document.createTextNode(' · '));
        const g = document.createElement('span');
        g.title = 'Gels de série : un jour manqué est pardonné par gel';
        g.innerHTML = `${imgIc('gel')} ${stats.freezes}`;
        themeEl.appendChild(g);
    }
    if (streakData.frozenUsed > 0) {
        const info = document.createElement('div');
        info.style.cssText = 'font-size:.78rem;font-weight:800;color:#4A6CFA;margin-top:4px;';
        info.innerHTML = `${imgIc('gel')} ${streakData.frozenUsed > 1 ? streakData.frozenUsed + ' gels ont' : 'Un gel a'} protégé votre série !`;
        themeEl.appendChild(info);
    }
    // Bannière d'événement calendaire (week-end double étoiles, défi du 1er)
    const ev = activeEvent();
    if (ev && !getPlayedInfo(day.id)) {
        const evEl = document.createElement('div');
        evEl.style.cssText = 'font-size:.8rem;font-weight:900;color:#B07E0A;background:#FFF6E3;' +
            'border-radius:10px;padding:6px 12px;margin-top:8px;display:inline-block;';
        evEl.textContent = ev.label;
        themeEl.appendChild(evEl);
    }

    // Tuiles décoratives : les chiffres du jour + une étoile
    const tilesEl = document.getElementById('daily-tiles');
    tilesEl.innerHTML = '';
    const digits = String(day.id).split('');
    digits.forEach((d, i) => {
        const t = document.createElement('div');
        t.className = 'tile' + (i % 2 === 1 ? ' t' : '');
        t.textContent = d;
        tilesEl.appendChild(t);
    });
    const star = document.createElement('div');
    star.className = 'tile t';
    star.textContent = '★';
    tilesEl.appendChild(star);

    const action = document.getElementById('daily-action');
    action.innerHTML = '';
    const info = getPlayedInfo(day.id);
    if (info) {
        const done = document.createElement('div');
        done.className = 'daily-done ' + (info.isWin ? 'win' : 'fail');
        const t = Math.abs(parseFloat(info.time));
        done.textContent = info.isWin
            ? `✓ Réussi en ${t.toFixed(3)} s`
            : (info.time === -999999 ? 'Partie abandonnée' : '✗ Raté — à demain !');
        action.appendChild(done);
        const review = document.createElement('button');
        review.className = 'btn btn-quiet';
        review.style.cssText = 'margin-top:12px;display:flex;margin-left:auto;margin-right:auto;';
        review.textContent = 'Voir le détail';
        review.addEventListener('click', () => selectDay(day));
        action.appendChild(review);
    } else {
        const play = document.createElement('button');
        play.className = 'btn btn-primary';
        play.textContent = 'Jouer';
        play.addEventListener('click', () => selectDay(day));
        action.appendChild(play);
    }

    // Classement du jour (top 3) sur l'accueil
    fetchBoardInto(day.id, document.getElementById('home-lead-list'), 3);
}

// ── CLASSEMENT (écran Ligue) ─────────────────────────────────────
function buildLeague() {
    buildWeeklyLeague();
    buildFriendBoards();
    const tid = todayDayId();
    const day = DAYS.find(d => d.id === tid) || DAYS[0];
    if (day.empty) {
        document.getElementById('league-sub').textContent = `Jour ${day.id} · pas de défi ce jour`;
        document.getElementById('league-note').textContent = 'Le classement reprend avec le calendrier de test.';
        document.getElementById('league-list').innerHTML = '';
        return;
    }
    const mode = GAME_MODES[day.modeId];
    document.getElementById('league-sub').textContent = `Jour ${day.id} · ${mode.name}`;
    document.getElementById('league-note').textContent = getPlayedInfo(day.id)
        ? 'Revenez demain pour le prochain défi.'
        : 'Jouez le puzzle du jour pour y figurer.';
    fetchBoardInto(day.id, document.getElementById('league-list'), 10);
}

// ── Ligue hebdomadaire (Supabase) : mon groupe de la semaine ─────
function buildWeeklyLeague() {
    const box = document.getElementById('weekly-league');
    if (typeof SB_ENABLED === 'undefined' || !SB_ENABLED) { box.hidden = true; return; }
    box.hidden = false;
    const list = document.getElementById('weekly-league-list');
    const note = document.getElementById('weekly-league-note');
    note.textContent = 'Victoires de la semaine · départage au temps total · fin dimanche soir';
    list.innerHTML = '';
    list.appendChild(_skeletonRows(5));

    sbJoinLeague()
        .then(g => g ? sbGetLeague() : null)
        .then(rows => {
            list.innerHTML = '';
            if (!rows || !rows.length) {
                list.innerHTML = '<li class="empty">La ligue s\'ouvre avec votre première victoire de la semaine !</li>';
                return;
            }
            const div = rows[0] && rows[0].division;
            const divLbl = ({ 1: `${imgIc('medal-or')} Ligue Or`, 2: `${imgIc('medal-argent')} Ligue Argent`, 3: `${imgIc('medal-bronze')} Ligue Bronze` })[div] || '';
            note.innerHTML = `${divLbl ? divLbl + ' · ' : ''}groupe de ${rows.length} joueuse${rows.length > 1 ? 's' : ''} ` +
                '· top 5 = promotion, 5 dernières = relégation · fin dimanche soir';
            rows.forEach((entry, index) => {
                const li = document.createElement('li');
                li.className = 'lrow' + (entry.is_me ? ' me' : '');
                const rk = document.createElement('span');
                rk.className = 'rk' + (index < 3 ? ' r' + (index + 1) : '');
                rk.textContent = index + 1;
                const av = document.createElement('span');
                av.className = 'av';
                av.textContent = (entry.pseudo || '?')[0].toUpperCase();
                const nm = document.createElement('span');
                nm.className = 'nm';
                nm.textContent = entry.pseudo + (entry.is_me ? ' (vous)' : '');
                const sc = document.createElement('span');
                sc.className = 'sc';
                sc.textContent = entry.wins + ' ✓' +
                    (entry.wins > 0 ? ` · ${(entry.total_time_ms / 1000).toFixed(0)} s` : '');
                li.append(rk, av, nm, sc);
                list.appendChild(li);
            });
        })
        .catch(() => {
            list.innerHTML = '<li class="empty">Ligue indisponible pour le moment.</li>';
        });
}

// ── Classements entre amies (groupes à code) ─────────────────────
function buildFriendBoards() {
    const zone = document.getElementById('friends-zone');
    if (typeof SB_ENABLED === 'undefined' || !SB_ENABLED) { zone.hidden = true; return; }
    zone.hidden = false;
    const boards = document.getElementById('friends-boards');
    boards.innerHTML = '<div class="hint" style="text-align:center;">Chargement…</div>';

    sbFriendBoards().then(rows => {
        boards.innerHTML = '';
        if (!rows || !rows.length) {
            boards.innerHTML = '<div class="hint" style="text-align:center;">Créez un groupe et partagez son code ' +
                'à votre sœur, vos collègues… Classement de la semaine entre vous !</div>';
            return;
        }
        // Regroupe par code
        const parCode = {};
        rows.forEach(r => { (parCode[r.code] = parCode[r.code] || { name: r.name, rows: [] }).rows.push(r); });
        Object.keys(parCode).forEach(code => {
            const g = parCode[code];
            const head = document.createElement('div');
            head.style.cssText = 'display:flex;align-items:center;gap:8px;margin:10px 2px 6px;';
            head.innerHTML = `<b style="flex:1;font-size:.9rem;">${g.name}</b>` +
                `<span class="hint" style="font-size:.7rem;">code <b style="letter-spacing:.1em;">${code}</b></span>`;
            const share = document.createElement('button');
            share.className = 'btn btn-quiet';
            share.style.cssText = 'padding:5px 12px;font-size:.72rem;flex-shrink:0;';
            share.textContent = 'Inviter';
            share.addEventListener('click', () => {
                const txt = `Rejoins mon groupe « ${g.name} » sur Orderix 🧩 — code : ${code}\n` +
                    'https://wael3rd.github.io/orderix/defi.html';
                if (navigator.share) navigator.share({ text: txt }).catch(() => { });
                else if (navigator.clipboard) navigator.clipboard.writeText(txt);
                if (typeof logEvent === 'function') logEvent('amies_invitation', { code: code });
            });
            head.appendChild(share);
            boards.appendChild(head);

            const ul = document.createElement('ul');
            g.rows.forEach((entry, index) => {
                const li = document.createElement('li');
                li.className = 'lrow' + (entry.is_me ? ' me' : '');
                li.innerHTML = `<span class="rk${index < 3 ? ' r' + (index + 1) : ''}">${index + 1}</span>` +
                    `<span class="av">${(entry.pseudo || '?')[0].toUpperCase()}</span>` +
                    `<span class="nm">${entry.pseudo}${entry.is_me ? ' (vous)' : ''}</span>` +
                    `<span class="sc">${entry.wins} ✓${entry.wins > 0 ? ` · ${(entry.total_time_ms / 1000).toFixed(0)} s` : ''}</span>`;
                ul.appendChild(li);
            });
            boards.appendChild(ul);
        });
    });
}

// ── CALENDRIER ───────────────────────────────────────────────────
// Deux affichages au choix (toggle en haut de l'écran) :
//  · 'grid' — les mois en grilles de pastilles (vue d'origine)
//  · 'list' — une ligne par jour, avec le nom du jeu
let calendarView = getStorage('orderix_cal_view') || 'grid';

function setCalendarView(v) {
    calendarView = v;
    setStorage('orderix_cal_view', v);
    document.getElementById('cal-view-grid').classList.toggle('on', v === 'grid');
    document.getElementById('cal-view-list').classList.toggle('on', v === 'list');
    buildCalendar();
}

function buildCalendar() {
    const container = document.getElementById('calendar-months');
    container.innerHTML = '';
    const tid = todayDayId();
    const year = new Date().getFullYear();

    const stats = computeStats();
    document.getElementById('calendar-sub').textContent =
        `${stats.won} puzzle${stats.won > 1 ? 's' : ''} réussi${stats.won > 1 ? 's' : ''} sur 365`;

    const enabledIds = {};
    DAYS.forEach(day => {
        const cfg = dayConfig[day.id];
        enabledIds[day.id] = !(cfg && cfg.enabled === false);
    });

    // Héros du mois en cours : trophée (silhouette → doré) + compteur N/total
    let curWon = 0, curTotal = 0;
    const curMonth = new Date().getMonth();

    const calFrag = document.createDocumentFragment();
    let dayId = 1;
    for (let m = 0; m < 12 && dayId <= 365; m++) {
        const daysInMonth = new Date(year, m + 1, 0).getDate();

        const block = document.createElement('div');
        block.className = 'month-block';

        const name = document.createElement('div');
        name.className = 'month-name';
        const label = document.createElement('span');
        label.textContent = MONTH_NAMES_FULL[m];
        name.appendChild(label);

        let monthWon = 0;

        const body = document.createElement('div');
        body.className = calendarView === 'list' ? 'month-list' : 'month-grid';
        const bodyFrag = document.createDocumentFragment();

        for (let d = 1; d <= daysInMonth && dayId <= 365; d++, dayId++) {
            const id = dayId;
            const day = DAYS.find(x => x.id === id);
            const info = getPlayedInfo(id);
            if (info && info.isWin) monthWon++;
            if (m === curMonth && !day.empty && enabledIds[id]) {
                curTotal++;
                if (info && info.isWin) curWon++;
            }
            bodyFrag.appendChild(calendarView === 'list'
                ? buildDayRow(day, d, id, tid, enabledIds[id], info)
                : buildDayChip(day, d, id, tid, enabledIds[id], info));
        }
        body.appendChild(bodyFrag);

        const count = document.createElement('span');
        count.className = 'month-count';
        count.textContent = monthWon > 0 ? `${monthWon} ✓` : '';
        name.appendChild(count);

        block.appendChild(name);
        block.appendChild(body);
        calFrag.appendChild(block);
    }
    container.appendChild(calFrag);

    // Remplit le héros du mois (masqué si le mois est vide, ex. pause)
    const hero = document.getElementById('cal-hero');
    if (hero) {
        if (curTotal === 0) { hero.style.display = 'none'; }
        else {
            const complet = curWon >= curTotal;
            hero.style.display = '';
            hero.innerHTML =
                `<div class="hero-flare${complet ? ' gold' : ''}">${imgIc('trophy', 'hero-trophy')}</div>` +
                `<div class="hero-count"><b>${curWon}</b> / ${curTotal}</div>` +
                `<div class="hero-sub">${MONTH_NAMES_FULL[curMonth]} — chaque jour réussi devient une médaille.` +
                (complet ? ' Trophée du mois gagné !' : ' Mois complet = trophée.') + `</div>`;
        }
    }
}

// Pastille de la vue grille (vue d'origine)
function buildDayChip(day, d, id, tid, enabled, info) {
    const chip = document.createElement('button');
    chip.className = 'day-chip';
    chip.textContent = d;

    if (day.empty || !enabled) { chip.style.opacity = '.3'; chip.disabled = true; return chip; }

    if (info && info.isWin) {
        chip.classList.add('win');
        if (info.late) chip.classList.add('late'); // rattrapage : teinte distincte
        // Jour réussi = médaille qui remplace le numéro (pattern Sudoku.com)
        chip.innerHTML = `<img class="chip-medal" src="assets/img/medal-or.png" alt="réussi">`;
    }
    else if (info) { chip.classList.add('fail'); }
    if (id === tid) chip.classList.add('today');

    // Version de test : « ! » sur les gameplays modifiés depuis
    // la dernière partie (nouveaux, corrigés ou remplacés)
    if (needsTest(day)) {
        const t = document.createElement('span');
        t.className = 'totest';
        t.textContent = '!';
        chip.appendChild(t);
    }

    chip.addEventListener('click', () => selectDay(day));
    return chip;
}

// Ligne de la vue liste : numéro du jour + nom du jeu + état
function buildDayRow(day, d, id, tid, enabled, info) {
    const row = document.createElement('button');
    row.className = 'day-row';

    const num = document.createElement('span');
    num.className = 'dr-num';
    num.textContent = d;
    row.appendChild(num);

    const name = document.createElement('span');
    name.className = 'dr-name';
    name.textContent = day.empty ? '—' : GAME_MODES[day.modeId].name;
    row.appendChild(name);

    if (day.empty || !enabled) {
        row.classList.add('off');
        row.disabled = true;
        return row;
    }

    if (needsTest(day)) {
        const t = document.createElement('span');
        t.className = 'dr-totest';
        t.textContent = '!';
        row.appendChild(t);
    }

    const state = document.createElement('span');
    state.className = 'dr-state';
    if (info && info.isWin) {
        state.textContent = '✓';
        row.classList.add('win');
        if (info.late) row.classList.add('late');
    }
    else if (info) { state.textContent = '✗'; row.classList.add('fail'); }
    else { state.textContent = '›'; }
    row.appendChild(state);

    if (id === tid) row.classList.add('today');

    row.addEventListener('click', () => selectDay(day));
    return row;
}

document.getElementById('cal-view-grid').addEventListener('click', () => setCalendarView('grid'));
document.getElementById('cal-view-list').addEventListener('click', () => setCalendarView('list'));
if (calendarView === 'list') {
    document.getElementById('cal-view-grid').classList.remove('on');
    document.getElementById('cal-view-list').classList.add('on');
}

// ── PROFIL ───────────────────────────────────────────────────────
const MONTH_SHORT = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

function buildProfile() {
    const stats = computeStats();
    document.getElementById('pstat-played').textContent = stats.played;
    document.getElementById('pstat-won').textContent = stats.won;
    document.getElementById('pstat-rate').textContent =
        stats.played > 0 ? Math.round(100 * stats.won / stats.played) + '%' : '—';
    document.getElementById('pstat-streak').textContent = stats.streak;
    document.getElementById('pstat-best').textContent = stats.best !== null ? stats.best.toFixed(2) + 's' : '—';
    document.getElementById('pstat-level').textContent = 1 + Math.floor(stats.stars / 10);
    document.getElementById('pstat-freezes').innerHTML = stats.freezes > 0
        ? `${imgIc('gel')} ${stats.freezes} gel${stats.freezes > 1 ? 's' : ''} de série en réserve (1 offert chaque mois, 1 par semaine parfaite)`
        : `${imgIc('gel')} Plus de gel en réserve — le prochain arrive au début du mois.`;

    // Vitrine des médailles mensuelles
    const row = document.getElementById('medals-row');
    row.innerHTML = '';
    monthMedals().forEach(m => {
        const cell = document.createElement('div');
        cell.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 2px;' +
            'border-radius:12px;background:var(--fond);';
        const ico = document.createElement('div');
        ico.style.cssText = 'font-size:1.3rem;line-height:1;';
        const lbl = document.createElement('div');
        lbl.style.cssText = 'font-size:.62rem;font-weight:800;color:var(--gris);';
        lbl.textContent = MONTH_SHORT[m.month];
        if (m.active === 0) {
            ico.textContent = '—';
            ico.style.opacity = '.3';
            cell.style.opacity = '.5';
        } else if (m.medal === 'or') {
            ico.innerHTML = imgIc('medal-or');
            cell.style.background = '#FFF6E3';
        } else if (m.medal === 'argent') {
            ico.innerHTML = imgIc('medal-argent');
            cell.style.background = '#EEF2FF';
        } else {
            ico.innerHTML = imgIc('medal-sport');
            ico.style.cssText += 'filter:grayscale(1);opacity:.35;';
        }
        const prog = document.createElement('div');
        prog.style.cssText = 'font-size:.6rem;font-weight:700;color:var(--gris);';
        prog.textContent = m.active > 0 ? `${m.won}/${m.active}` : '';
        cell.append(ico, lbl, prog);
        row.appendChild(cell);
    });

    buildYearFresque();
    renderCosmetics();
    buildWeekRecap();
}

// ── « Ma semaine » : bilan de la semaine calendaire en cours ─────
const WEEKDAY_LETTRES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function computeWeekRecap() {
    const tid = todayDayId();
    const dow = (new Date().getDay() + 6) % 7; // 0 = lundi
    const lundi = tid - dow;
    const jours = [];
    let joues = 0, gagnes = 0, best = null;
    for (let i = 0; i < 7; i++) {
        const id = lundi + i;
        const day = (id >= 1 && id <= 365) ? DAYS.find(d => d.id === id) : null;
        const info = day && !day.empty ? getPlayedInfo(id) : null;
        let etat = 'futur';
        if (!day || day.empty) etat = 'vide';
        else if (info && info.isWin) { etat = 'win'; joues++; gagnes++; }
        else if (info) { etat = 'fail'; joues++; }
        else if (i <= dow) etat = 'manque';
        if (info && info.isWin) {
            const t = Math.abs(parseFloat(info.time));
            if (best === null || t < best) best = t;
        }
        jours.push({ id: id, etat: etat, aujourdhui: id === tid });
    }
    return { jours: jours, joues: joues, gagnes: gagnes, best: best };
}

function buildWeekRecap() {
    const zone = document.getElementById('week-recap');
    if (!zone) return;
    const r = computeWeekRecap();
    zone.innerHTML = '';

    const strip = document.createElement('div');
    strip.style.cssText = 'display:flex;gap:6px;justify-content:center;';
    const COUL = { win: '#34B871', fail: '#F5B8AD', manque: '#E8EAF1', futur: '#F4F6FA', vide: '#F4F6FA' };
    r.jours.forEach((j, i) => {
        const c = document.createElement('div');
        c.style.cssText = 'flex:1;max-width:44px;display:flex;flex-direction:column;align-items:center;gap:3px;';
        const dot = document.createElement('div');
        dot.style.cssText = `width:100%;aspect-ratio:1;border-radius:10px;background:${COUL[j.etat]};` +
            'display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;font-size:.85rem;' +
            (j.aujourdhui ? 'outline:2px solid var(--bleu);outline-offset:1px;' : '');
        if (j.etat === 'win') dot.textContent = '✓';
        if (j.etat === 'fail') { dot.textContent = '✗'; dot.style.color = '#E0533D'; }
        const lbl = document.createElement('span');
        lbl.style.cssText = 'font-size:.62rem;font-weight:800;color:var(--gris);';
        lbl.textContent = WEEKDAY_LETTRES[i];
        c.append(dot, lbl);
        strip.appendChild(c);
    });
    zone.appendChild(strip);

    const bilan = document.createElement('div');
    bilan.style.cssText = 'text-align:center;font-size:.82rem;font-weight:700;color:var(--gris);margin-top:10px;';
    bilan.textContent = r.joues === 0
        ? 'Aucune partie cette semaine — le puzzle du jour vous attend !'
        : `${r.gagnes} réussite${r.gagnes > 1 ? 's' : ''} sur ${r.joues} jouée${r.joues > 1 ? 's' : ''}` +
        (r.best !== null ? ` · meilleure perf ${r.best.toFixed(2).replace('.', ',')} s` : '');
    zone.appendChild(bilan);
}

// ── « Mon année » : fresque des 365 jours + trophées de paliers ──
function buildYearFresque() {
    const zone = document.getElementById('year-fresque');
    zone.innerHTML = '';
    const tid = todayDayId();
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(21,1fr);gap:2px;';
    let wonTotal = 0;
    for (let id = 1; id <= 365; id++) {
        const day = DAYS.find(x => x.id === id);
        const cell = document.createElement('div');
        let bg = '#E8EAF1'; // pas encore joué
        if (!day || day.empty) bg = '#F4F6FA';
        else {
            const info = getPlayedInfo(id);
            if (info && info.isWin) { bg = info.late ? '#8FD8B0' : '#34B871'; wonTotal++; }
            else if (info) bg = '#F5B8AD';
        }
        cell.style.cssText = `aspect-ratio:1;border-radius:2px;background:${bg};` +
            (id === tid ? 'outline:2px solid #4A6CFA;outline-offset:-1px;' : '');
        grid.appendChild(cell);
    }
    zone.appendChild(grid);

    const troph = document.getElementById('year-trophies');
    troph.innerHTML = '';
    [[50, 'pousse', '50 jours'], [100, 'herbe', '100 jours'], [200, 'arbre', '200 jours'], [365, 'trophy', 'Année parfaite']]
        .forEach(([seuil, ico, lbl]) => {
            const t = document.createElement('div');
            const atteint = wonTotal >= seuil;
            t.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 12px;' +
                `border-radius:12px;background:${atteint ? '#FFF6E3' : 'var(--fond)'};` +
                (atteint ? '' : 'opacity:.45;filter:grayscale(.8);');
            t.innerHTML = `<span style="font-size:1.2rem;line-height:1;">${imgIc(ico)}</span>` +
                `<span style="font-size:.62rem;font-weight:800;color:var(--gris);">${lbl}</span>`;
            troph.appendChild(t);
        });
}

// ── BOUTIQUE : Carnet de Saison, packs, arrière-plans exclusifs ──
const MOIS_LONGS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
    'août', 'septembre', 'octobre', 'novembre', 'décembre'];

function _shopBuyMessage() {
    const st = document.getElementById('shop-status');
    st.textContent = '💛 Les achats ouvriront avec la version Play Store — tout est déjà prêt de notre côté !';
    haptic(8);
}

function buildShop() {
    claimPassRewards();
    const stars = seasonStars();
    const premium = hasPack('pass-premium');
    const now = new Date();

    document.getElementById('pass-mois').innerHTML =
        'Saison de ' + MOIS_LONGS[now.getMonth()] + ' · ' + imgIc('etoile') + ' ' + stars;

    // Barre de progression vers le dernier palier
    const maxEtoiles = PASS_TIERS[PASS_TIERS.length - 1].etoiles;
    const prog = document.getElementById('pass-progress');
    prog.innerHTML = `<div style="height:10px;border-radius:999px;background:var(--ligne);overflow:hidden;">
        <div style="height:100%;width:${Math.min(100, Math.round(100 * stars / maxEtoiles))}%;
        background:linear-gradient(90deg,var(--or),#FFD778);border-radius:999px;"></div></div>`;

    // Paliers : colonne par palier, piste GRATUITE en haut (pour toutes),
    // piste Premium en bas — avec une colonne de libellés pour que la
    // gratuité saute aux yeux
    const tiers = document.getElementById('pass-tiers');
    tiers.innerHTML = '';
    const legend = document.createElement('div');
    legend.style.cssText = 'flex-shrink:0;width:64px;display:flex;flex-direction:column;gap:6px;position:sticky;left:0;background:var(--carte);z-index:2;';
    legend.innerHTML = '<div style="height:15px;"></div>' +
        '<div style="min-height:52px;display:flex;align-items:center;justify-content:center;text-align:center;' +
        'font-size:.62rem;font-weight:900;color:#1E7A4A;background:var(--vert-pale,#E3F7ED);border-radius:10px;">GRATUITE<br>pour toutes</div>' +
        '<div style="min-height:52px;display:flex;align-items:center;justify-content:center;text-align:center;' +
        'font-size:.62rem;font-weight:900;color:var(--bleu-fonce);background:var(--bleu-pale);border-radius:10px;">' + imgIc('ticket') + ' PREMIUM<br>4,99 €</div>';
    tiers.appendChild(legend);
    PASS_TIERS.forEach((t, i) => {
        const reached = stars >= t.etoiles;
        const col = document.createElement('div');
        col.style.cssText = 'flex-shrink:0;width:96px;display:flex;flex-direction:column;gap:6px;';
        const et = document.createElement('div');
        et.style.cssText = 'text-align:center;font-weight:900;font-size:.72rem;' +
            `color:${reached ? 'var(--or)' : 'var(--gris)'};`;
        et.innerHTML = imgIc('etoile') + ' ' + t.etoiles;
        const mk = (r, locked, piste) => {
            const c = document.createElement('div');
            c.style.cssText = 'border-radius:10px;padding:8px 6px;text-align:center;font-size:.66rem;font-weight:800;' +
                'min-height:52px;display:flex;flex-direction:column;justify-content:center;gap:2px;' +
                (locked ? 'background:var(--fond);color:var(--gris);opacity:.75;'
                    : 'background:var(--vert-pale,#E3F7ED);color:#1E7A4A;');
            c.innerHTML = `<span style="font-size:1rem;">${r.ico ? imgIc(r.ico) : r.lbl.split(' ')[0]}</span>` +
                `<span>${r.ico ? r.lbl : r.lbl.substring(r.lbl.indexOf(' ') + 1)}</span>` +
                (locked && piste === 'premium' ? '<span style="font-size:.58rem;">' + imgIc('ticket') + ' Premium</span>' : '');
            return c;
        };
        col.append(et, mk(t.gratuit, !reached, 'gratuit'), mk(t.premium, !reached || !premium, 'premium'));
        tiers.appendChild(col);
    });

    const buy = document.getElementById('pass-buy');
    buy.style.display = premium ? 'none' : '';
    document.getElementById('pass-status').textContent = premium
        ? '✓ Pass Premium actif pour cette saison — merci ! 💛' : '';

    // Packs de thèmes
    const packs = document.getElementById('shop-packs');
    packs.innerHTML = '';
    [{ id: 'pack-aurore', nom: 'Pack Aurore', desc: 'Thème terracotta doré + avatars 🦩 🌅', theme: 'aurore' },
    { id: 'pack-foret', nom: 'Pack Forêt', desc: 'Thème vert profond + avatars 🦚 🌲', theme: 'foret' }]
        .forEach(p => {
            const owned = hasPack(p.id);
            const t = THEMES.find(x => x.id === p.theme);
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid var(--ligne);';
            row.innerHTML = `<div style="width:44px;height:44px;border-radius:50%;background:${t.bleu};flex-shrink:0;
                box-shadow:inset 0 -4px 0 rgba(0,0,0,.15);"></div>
                <div style="flex:1;"><b style="font-size:.92rem;">${p.nom}</b>
                <div class="hint" style="font-size:.74rem;">${p.desc}</div></div>`;
            const b = document.createElement('button');
            b.className = owned ? 'btn btn-quiet' : 'btn btn-plum';
            b.style.cssText = 'flex-shrink:0;padding:9px 14px;font-size:.8rem;';
            b.textContent = owned ? '✓ À vous' : '2,99 €';
            if (!owned) b.addEventListener('click', _shopBuyMessage);
            row.appendChild(b);
            packs.appendChild(row);
        });

    // Arrière-plans exclusifs boutique
    const fonds = document.getElementById('shop-fonds');
    fonds.innerHTML = '';
    BACKGROUNDS.filter(b => b.boutique).forEach(b => {
        const owned = hasPack(b.boutique);
        const cell = document.createElement('div');
        cell.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
        cell.innerHTML = `<div style="aspect-ratio:4/3;border-radius:12px;background:${b.css};
            border:1.5px solid var(--ligne);"></div>
            <b style="font-size:.8rem;text-align:center;">${b.nom}</b>`;
        const btn = document.createElement('button');
        btn.className = owned ? 'btn btn-quiet' : 'btn btn-plum';
        btn.style.cssText = 'padding:8px;font-size:.78rem;';
        btn.textContent = owned ? '✓ À vous' : b.prix;
        if (!owned) btn.addEventListener('click', _shopBuyMessage);
        else btn.addEventListener('click', () => { selectBackground(b.id); showScreen('profile'); });
        cell.appendChild(btn);
        fonds.appendChild(cell);
    });
}

// ── OUVERTURE D'UN JOUR (écran de jeu, phase intro) ──────────────
function selectDay(day) {
    if (day.empty) return; // jour sans défi (après la campagne de test)
    // La bannière de défi (lien partagé) ne concerne qu'une ouverture
    const chalBanner = document.getElementById('challenge-banner');
    if (chalBanner) chalBanner.classList.add('hidden');
    currentDayConfig = day;
    // Mémorise l'écran d'origine : le bouton retour y ramènera
    if (currentScreen !== 'game') returnScreen = currentScreen;
    showScreen('game');

    // Remise à zéro de l'écran de jeu
    clearInterval(timerInterval);
    clearTimeout(gameTimeout);
    clearInterval(envInterval);
    clearInterval(window.speedTimer);
    timeElapsed = 0;
    timerDisplay.textContent = '0.000';
    timerDisplay.classList.remove('late');
    resetBoard();
    board.classList.add('hidden');
    checkBtn.classList.add('hidden');
    resultPanel.classList.add('hidden');
    resultDisplay.textContent = '';
    dbMessage.textContent = '';
    leaderboardSection.classList.add('hidden');
    document.getElementById('comment-zone').classList.add('hidden');
    document.getElementById('comment-status').textContent = '';

    const mode = GAME_MODES[day.modeId];
    const base = BASE_TYPES.find(b => b.type === day.type);
    const date = dateOfDayId(day.id);
    gameDayLabel.textContent = `Jour ${day.id} · ${date.getDate()} ${MONTH_NAMES_FULL[date.getMonth()]}`;
    levelTitle.textContent = mode.name;
    levelType.textContent = mode.typeAgnostic ? '' : (base ? 'Thème : ' + base.title : '');

    const cfg = dayConfig[day.id];
    activeItemCount = (cfg && cfg.count) ? cfg.count : 10;

    const info = getPlayedInfo(day.id);
    if (info) {
        // Jour déjà joué : pas de seconde tentative, on montre le résultat + classement
        introPanel.classList.add('hidden');
        activeItemCount = info.count || activeItemCount;

        const t = Math.abs(parseFloat(info.time));
        resultPanel.classList.remove('hidden');
        resultStatus.textContent = info.isWin ? 'Réussi' : 'Déjà tenté';
        resultStatus.className = 'result-status ' + (info.isWin ? 'win' : 'fail');
        resultTime.innerHTML = info.time === -999999 ? '<small>Partie abandonnée</small>'
            : `${t.toFixed(3)}<small> s</small>`;
        resultPhrase.textContent = info.isWin ? 'Ce puzzle est dans la poche.' : 'Chaque puzzle ne se tente qu\'une fois.';
        feedbackQ.classList.add('hidden');
        feedbackContainer.classList.add('hidden');
        resultActions.classList.remove('hidden');
        document.getElementById('comment-zone').classList.remove('hidden');
        pendingTimeVal = 0;

        leaderboardTitle.textContent = `Classement — Jour ${day.id}`;
        leaderboardSection.classList.remove('hidden');
        fetchLeaderboard();
    } else {
        // Phase d'introduction : consigne + exemple + bouton commencer
        introPanel.classList.remove('hidden');
        introRule.textContent = mode.desc || '';
        showExample(day, exampleZone);
        leaderboardTitle.textContent = `Classement — Jour ${day.id}`;
    }
}
