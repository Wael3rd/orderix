// =====================================================================
// Game Logic: timer, item selection, order verification
// =====================================================================

var timerInterval = null;
var lastTime = 0;
var timeElapsed = 0;
var selectionOrder = [];
var isPaused = false;
var activeItemCount = 10;
var currentDayConfig = null;

function startGame() {
    if (!isNameValid) {
        alert("Veuillez valider un pseudo disponible dans les paramètres avant de jouer.");
        returnToMenu();
        return;
    }

    var inputVal = parseInt(document.getElementById('item-count').value);
    activeItemCount = (inputVal >= 5 && inputVal <= 20) ? inputVal : 10;

    timeElapsed = 0;
    isPaused = false;
    selectionOrder = [];

    uiStartGame();

    var values = generateValues(currentDayConfig.type, activeItemCount);
    var shuffled = values.slice().sort(function () { return Math.random() - 0.5; });

    var board = document.getElementById('game-board');
    shuffled.forEach(function (val) {
        var item = document.createElement('div');
        item.className = 'item type-' + currentDayConfig.type;
        item.dataset.value = val;
        applyStyle(item, currentDayConfig.type, val);
        item.addEventListener('click', function () {
            if (!isPaused) handleSelection(item);
        });
        board.appendChild(item);
    });

    clearInterval(timerInterval);
    lastTime = Date.now();
    timerInterval = setInterval(gameTick, 10);
}

function gameTick() {
    if (isPaused) { lastTime = Date.now(); return; }
    var now = Date.now();
    timeElapsed += (now - lastTime);
    lastTime = now;
    document.getElementById('timer-display').textContent = (timeElapsed / 1000).toFixed(3);
}

function handleSelection(item) {
    var index = selectionOrder.indexOf(item);
    if (index > -1) {
        selectionOrder.splice(index, 1);
        item.classList.remove('selected');
    } else {
        if (selectionOrder.length >= activeItemCount) return;
        selectionOrder.push(item);
        item.classList.add('selected');
    }
    renderBadges();
}

function renderBadges() {
    document.querySelectorAll('.badge').forEach(function (b) { b.remove(); });
    selectionOrder.forEach(function (item, index) {
        var badge = document.createElement('div');
        badge.className = 'badge';
        badge.textContent = index + 1;
        item.appendChild(badge);
    });
}

function verifyOrder() {
    if (isPaused) return;
    var resultDisplay = document.getElementById('result');

    if (selectionOrder.length < activeItemCount) {
        resultDisplay.textContent = 'Sélectionnez les ' + activeItemCount + ' éléments d\'abord.';
        resultDisplay.style.color = '#ff9800';
        setTimeout(function () { if (!isPaused) resultDisplay.textContent = ''; }, 1500);
        return;
    }

    var values = selectionOrder.map(function (el) { return parseFloat(el.dataset.value); });
    var sortedValues = values.slice().sort(function (a, b) { return a - b; });

    // For inverted ranges (warm, inset, checkers), sort descending
    var day = currentDayConfig;
    var inverted = day.range[0] > day.range[1];
    if (inverted) {
        sortedValues = values.slice().sort(function (a, b) { return b - a; });
    }

    var isCorrect = values.every(function (val, i) { return val === sortedValues[i]; });

    if (isCorrect) {
        endGame('Bravo ! Jour terminé.', true);
    } else {
        isPaused = true;
        clearInterval(timerInterval);
        uiShowFailCorrection(selectionOrder, sortedValues, currentDayConfig);
        endGame('Erreur ! Voici la correction.', false);
    }
}

function endGame(message, isWin) {
    clearInterval(timerInterval);
    isPaused = true;

    uiEndGame(message, isWin, timeElapsed);

    // Save completion
    try {
        var playedDays = JSON.parse(getStorage('orderix_played_days') || '{}');
        var key = currentDayConfig.id + '_' + activeItemCount;
        playedDays[key] = { count: activeItemCount, time: timeElapsed, isWin: isWin };
        setStorage('orderix_played_days', JSON.stringify(playedDays));
    } catch (e) { }

    // Submit score
    var name = document.getElementById('player-name-main').value.trim();
    var storedName = getStorage('orderix_player_name');
    if (storedName) name = storedName;

    var dbMessage = document.getElementById('db-message');
    dbMessage.textContent = 'Envoi du score en cours...';
    dbMessage.style.color = '#333';

    apiSubmitScore(
        { name: name, time: isWin ? (timeElapsed / 1000).toFixed(3) : -1, day: currentDayConfig.id, itemCount: activeItemCount },
        function (data) {
            if (data.status === 'error') {
                if (data.message === 'Banned word') dbMessage.textContent = 'Ce nom contient un mot interdit.';
                else if (data.message === 'Name taken for this config') dbMessage.textContent = 'Score déjà enregistré pour cette difficulté.';
                else dbMessage.textContent = 'Erreur serveur.';
                dbMessage.style.color = '#dc3545';
            } else {
                dbMessage.textContent = 'Score enregistré avec succès !';
                dbMessage.style.color = '#28a745';
            }
            fetchLeaderboard();
        },
        function () {
            dbMessage.textContent = 'Erreur de connexion au serveur.';
            dbMessage.style.color = '#dc3545';
            fetchLeaderboard();
        }
    );
}

function fetchLeaderboard() {
    var list = document.getElementById('leaderboard-list');
    list.innerHTML = '<li style="padding:10px;text-align:center;">Chargement...</li>';

    apiFetchLeaderboard(currentDayConfig.id, activeItemCount,
        function (data) {
            list.innerHTML = '';
            if (!data.length) {
                list.innerHTML = '<li style="padding:10px;text-align:center;">Aucun score pour cette configuration.</li>';
                return;
            }
            data.forEach(function (entry, index) {
                var li = document.createElement('li');
                li.className = 'lb-entry';
                var rankStyle = 'font-weight:bold;';
                if (index === 0) rankStyle += 'color:gold;';
                else if (index === 1) rankStyle += 'color:silver;';
                else if (index === 2) rankStyle += 'color:#cd7f32;';

                var timeDisplay = entry.time === -1 ? 'FAIL' : entry.time.toFixed(3) + 's';
                var colorStyle = entry.time === -1 ? 'color:#dc3545;' : '';

                li.innerHTML = '<span><span style="' + rankStyle + '">#' + (index + 1) + '</span> ' + entry.name + '</span>' +
                    '<span style="font-family:monospace;font-weight:bold;' + colorStyle + '">' + timeDisplay + '</span>';
                list.appendChild(li);
            });
        },
        function () {
            list.innerHTML = '<li style="padding:10px;text-align:center;color:red;">Erreur de chargement.</li>';
        }
    );
}
