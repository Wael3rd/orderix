// =====================================================================
// Storage: window.name (primary) + localStorage + IndexedDB fallbacks
// Survives iframe reloads on Google Sites / GitHub Pages
// =====================================================================

function _getWnStore() {
    try {
        if (window.name && window.name.charAt(0) === '{') return JSON.parse(window.name);
    } catch (e) { }
    return {};
}

function _saveWnStore(store) {
    try { window.name = JSON.stringify(store); } catch (e) { }
}

function setStorage(key, value) {
    var store = _getWnStore();
    store[key] = value;
    _saveWnStore(store);
    try { localStorage.setItem(key, value); } catch (e) { }
    try {
        document.cookie = key + '=' + encodeURIComponent(value) + '; max-age=31536000; path=/; SameSite=None; Secure';
    } catch (e) { }
    try {
        var req = indexedDB.open('OrderixDB', 1);
        req.onupgradeneeded = function () { req.result.createObjectStore('kv'); };
        req.onsuccess = function () {
            var tx = req.result.transaction('kv', 'readwrite');
            tx.objectStore('kv').put(value, key);
        };
    } catch (e) { }
}

function getStorage(key) {
    var store = _getWnStore();
    if (store[key] !== undefined) return store[key];
    try { var v = localStorage.getItem(key); if (v !== null) return v; } catch (e) { }
    try {
        var match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
        if (match) return decodeURIComponent(match[2]);
    } catch (e) { }
    return null;
}

function tryRecoverFromIDB(callback) {
    try {
        var req = indexedDB.open('OrderixDB', 1);
        req.onupgradeneeded = function () { req.result.createObjectStore('kv'); };
        req.onsuccess = function () {
            var tx = req.result.transaction('kv', 'readonly');
            var g1 = tx.objectStore('kv').get('orderix_player_name');
            g1.onsuccess = function () {
                if (g1.result) {
                    setStorage('orderix_player_name', g1.result);
                    if (callback) callback(g1.result);
                }
            };
            var g2 = tx.objectStore('kv').get('orderix_played_days');
            g2.onsuccess = function () {
                if (g2.result && !getStorage('orderix_played_days')) {
                    setStorage('orderix_played_days', g2.result);
                }
            };
        };
    } catch (e) { }
}
