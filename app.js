// =====================================================================
// App: Initialization & Event Wiring
// =====================================================================

(function init() {
    // Load saved name synchronously
    var savedName = getStorage('orderix_player_name');
    var nameInputContainer = document.getElementById('name-input-container');
    var nameStatus = document.getElementById('name-status');
    var lockedNameDisplay = document.getElementById('locked-name-display');

    if (savedName) {
        isNameValid = true;
        nameInputContainer.classList.add('hidden');
        nameStatus.classList.add('hidden');
        lockedNameDisplay.textContent = savedName;
        lockedNameDisplay.classList.remove('hidden');
    } else {
        // Try async IDB recovery
        tryRecoverFromIDB(function (recoveredName) {
            if (recoveredName && !isNameValid) {
                isNameValid = true;
                nameInputContainer.classList.add('hidden');
                nameStatus.classList.add('hidden');
                lockedNameDisplay.textContent = recoveredName;
                lockedNameDisplay.classList.remove('hidden');
            }
        });
    }

    // Build sidebar
    initSidebar();

    // Wire buttons
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('check-btn').addEventListener('click', verifyOrder);
    document.getElementById('menu-btn').addEventListener('click', returnToMenu);
    document.getElementById('verify-name-btn').addEventListener('click', verifyPlayerName);
})();

function verifyPlayerName() {
    var input = document.getElementById('player-name-main');
    var nameStatus = document.getElementById('name-status');
    var nameInputContainer = document.getElementById('name-input-container');
    var lockedNameDisplay = document.getElementById('locked-name-display');
    var verifyBtn = document.getElementById('verify-name-btn');

    var name = input.value.trim();
    if (name.length < 3) {
        nameStatus.textContent = '3 caractères minimum.';
        nameStatus.style.color = '#dc3545';
        isNameValid = false;
        return;
    }

    if (name === getStorage('orderix_player_name')) {
        isNameValid = true;
        nameInputContainer.classList.add('hidden');
        nameStatus.classList.add('hidden');
        lockedNameDisplay.textContent = name;
        lockedNameDisplay.classList.remove('hidden');
        return;
    }

    nameStatus.textContent = 'Vérification...';
    nameStatus.style.color = '#333';
    verifyBtn.disabled = true;

    apiVerifyName(name,
        function (data) {
            verifyBtn.disabled = false;
            if (data.available) {
                isNameValid = true;
                setStorage('orderix_player_name', name);
                nameInputContainer.classList.add('hidden');
                nameStatus.classList.add('hidden');
                lockedNameDisplay.textContent = name;
                lockedNameDisplay.classList.remove('hidden');
            } else {
                isNameValid = false;
                nameStatus.textContent = data.reason;
                nameStatus.style.color = '#dc3545';
            }
        },
        function () {
            verifyBtn.disabled = false;
            nameStatus.textContent = 'Erreur réseau.';
            nameStatus.style.color = '#dc3545';
        }
    );
}
