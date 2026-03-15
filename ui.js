// =====================================================================
// UI: Sidebar building, day selection, game state rendering
// =====================================================================

var isNameValid = false;

function initSidebar() {
    var container = document.getElementById('day-buttons-container');
    container.innerHTML = '';

    CATEGORIES.forEach(function (cat) {
        var heading = document.createElement('div');
        heading.className = 'cat-heading';
        heading.textContent = cat.icon + ' ' + cat.name;
        container.appendChild(heading);

        cat.days.forEach(function (dayId) {
            var day = getDayById(dayId);
            if (!day) return;
            var btn = document.createElement('button');
            btn.className = 'day-btn';
            btn.dataset.dayId = day.id;
            btn.textContent = 'Jour ' + day.id;

            // Check if already played (any item count)
            try {
                var played = JSON.parse(getStorage('orderix_played_days') || '{}');
                for (var k in played) {
                    if (k.split('_')[0] === String(day.id)) {
                        btn.classList.add('completed');
                        break;
                    }
                }
            } catch (e) { }

            btn.addEventListener('click', function () { selectDay(day, btn); });
            container.appendChild(btn);
        });
    });
}

function selectDay(day, btnElement) {
    document.getElementById('sidebar').classList.add('hidden');
    document.getElementById('menu-btn').classList.remove('hidden');
    document.getElementById('leaderboard-section').classList.add('hidden');

    document.querySelectorAll('.day-btn').forEach(function (b) { b.classList.remove('active'); });
    btnElement.classList.add('active');

    clearInterval(timerInterval);
    timeElapsed = 0;
    var timer = document.getElementById('timer-display');
    timer.textContent = '0.000';
    timer.style.color = '#333';
    document.getElementById('game-board').classList.add('hidden');
    document.getElementById('check-btn').classList.add('hidden');
    document.getElementById('result').textContent = '';
    document.getElementById('db-message').textContent = '';

    currentDayConfig = day;
    document.getElementById('level-title').textContent = 'Jour ' + day.id + ' : ' + day.title;

    var inputVal = parseInt(document.getElementById('item-count').value);
    activeItemCount = (inputVal >= 5 && inputVal <= 20) ? inputVal : 10;

    // Check if already played for this specific config
    var playedInfo = null;
    try {
        var playedDays = JSON.parse(getStorage('orderix_played_days') || '{}');
        var key = day.id + '_' + activeItemCount;
        playedInfo = playedDays[key];
    } catch (e) { }

    document.getElementById('leaderboard-title').textContent = 'Top 10 - Jour ' + day.id + ' (' + activeItemCount + ' éléments)';

    if (playedInfo) {
        uiShowAlreadyPlayed(day, playedInfo);
    } else {
        document.getElementById('start-btn').classList.remove('hidden');
        document.getElementById('start-btn').textContent = 'Démarrer';
    }
}

function uiShowAlreadyPlayed(day, playedInfo) {
    var startBtn = document.getElementById('start-btn');
    var board = document.getElementById('game-board');
    var result = document.getElementById('result');

    startBtn.classList.add('hidden');
    activeItemCount = playedInfo.count;

    result.innerHTML = 'Niveau déjà complété.<br>Votre temps : ' + (playedInfo.isWin ? (playedInfo.time / 1000).toFixed(3) + 's' : 'FAIL');
    result.style.color = playedInfo.isWin ? '#28a745' : '#dc3545';

    board.innerHTML = '';
    board.classList.remove('hidden');
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    var solTitle = document.createElement('h3');
    solTitle.textContent = 'Solution :';
    solTitle.style.margin = '0 0 10px 0';
    board.appendChild(solTitle);

    var solRow = document.createElement('div');
    solRow.style.cssText = 'display:flex;gap:15px;flex-wrap:wrap;justify-content:center;';

    var values = generateValues(day.type, activeItemCount);
    var inverted = day.range[0] > day.range[1];
    values.sort(inverted ? function (a, b) { return b - a; } : function (a, b) { return a - b; });

    values.forEach(function (val, index) {
        var item = document.createElement('div');
        item.className = 'item type-' + day.type + ' selected';
        applyStyle(item, day.type, val);
        var badge = document.createElement('div');
        badge.className = 'badge';
        badge.textContent = index + 1;
        item.appendChild(badge);
        solRow.appendChild(item);
    });
    board.appendChild(solRow);

    document.getElementById('leaderboard-section').classList.remove('hidden');
    fetchLeaderboard();
}

function uiStartGame() {
    var board = document.getElementById('game-board');
    document.getElementById('start-btn').classList.add('hidden');
    document.getElementById('check-btn').classList.remove('hidden');
    document.getElementById('result').textContent = '';
    document.getElementById('leaderboard-section').classList.add('hidden');
    document.getElementById('timer-display').style.color = '#333';
    document.getElementById('leaderboard-title').textContent = 'Top 10 - Jour ' + currentDayConfig.id + ' (' + activeItemCount + ' éléments)';

    board.classList.remove('hidden');
    board.style.flexDirection = 'row';
    board.style.alignItems = 'flex-start';
    board.innerHTML = '';
}

function uiShowFailCorrection(playerOrder, sortedValues, dayConfig) {
    var board = document.getElementById('game-board');
    var timer = document.getElementById('timer-display');
    timer.textContent = 'FAIL';
    timer.style.color = '#dc3545';

    board.innerHTML = '';
    board.style.flexDirection = 'column';
    board.style.alignItems = 'center';

    // Player response
    var userTitle = document.createElement('h3');
    userTitle.textContent = 'Votre réponse :';
    userTitle.style.margin = '0 0 10px 0';
    board.appendChild(userTitle);

    var userRow = document.createElement('div');
    userRow.style.cssText = 'display:flex;gap:15px;flex-wrap:wrap;justify-content:center;margin-bottom:30px;';

    playerOrder.forEach(function (item, index) {
        var clone = item.cloneNode(true);
        var expectedVal = sortedValues[index];
        var actualVal = parseFloat(clone.dataset.value);
        if (actualVal !== expectedVal) {
            clone.classList.add('error');
            var badge = clone.querySelector('.badge');
            if (badge) badge.classList.add('error');
        }
        userRow.appendChild(clone);
    });
    board.appendChild(userRow);

    // Solution
    var solTitle = document.createElement('h3');
    solTitle.textContent = 'Solution :';
    solTitle.style.margin = '0 0 10px 0';
    board.appendChild(solTitle);

    var solRow = document.createElement('div');
    solRow.style.cssText = 'display:flex;gap:15px;flex-wrap:wrap;justify-content:center;';

    var items = Array.from(playerOrder);
    var inverted = dayConfig.range[0] > dayConfig.range[1];
    items.sort(inverted
        ? function (a, b) { return parseFloat(b.dataset.value) - parseFloat(a.dataset.value); }
        : function (a, b) { return parseFloat(a.dataset.value) - parseFloat(b.dataset.value); }
    );

    items.forEach(function (item, index) {
        var clone = item.cloneNode(true);
        clone.className = 'item type-' + dayConfig.type + ' selected';
        var badge = clone.querySelector('.badge');
        if (badge) { badge.textContent = index + 1; badge.className = 'badge'; }
        solRow.appendChild(clone);
    });
    board.appendChild(solRow);
}

function uiEndGame(message, isWin, time) {
    document.getElementById('check-btn').classList.add('hidden');
    document.getElementById('start-btn').classList.add('hidden');
    document.getElementById('leaderboard-section').classList.remove('hidden');

    var result = document.getElementById('result');
    var timeStr = isWin ? (time / 1000).toFixed(3) : 'FAIL';
    result.innerHTML = message + '<br>Temps : ' + timeStr + (isWin ? ' secondes' : '') + '.';
    result.style.color = isWin ? '#28a745' : '#dc3545';
}

function returnToMenu() {
    document.getElementById('sidebar').classList.remove('hidden');
    document.getElementById('menu-btn').classList.add('hidden');
    document.getElementById('start-btn').classList.add('hidden');
    document.getElementById('check-btn').classList.add('hidden');
    document.getElementById('game-board').classList.add('hidden');
    document.getElementById('leaderboard-section').classList.add('hidden');

    clearInterval(timerInterval);
    timeElapsed = 0;
    document.getElementById('timer-display').textContent = '0.000';
    document.getElementById('timer-display').style.color = '#333';
    document.getElementById('result').textContent = '';
    document.getElementById('db-message').textContent = '';
    document.getElementById('level-title').textContent = 'Sélectionnez un jour pour commencer';
    document.querySelectorAll('.day-btn').forEach(function (b) { b.classList.remove('active'); });
    currentDayConfig = null;
}
