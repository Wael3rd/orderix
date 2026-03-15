// =====================================================================
// Network: GAS API calls (submit score, fetch leaderboard, verify name)
// =====================================================================

var GAS_URL = "https://script.google.com/macros/s/AKfycbwdBn3nmfJzB-uNlGGQ2_u5-6hqRy4urDKOWRTQWmclVwnmjE5NCE8TYPu6Saelwu_y6g/exec";

function apiVerifyName(name, onSuccess, onError) {
    fetch(GAS_URL + '?checkName=' + encodeURIComponent(name))
        .then(function (r) { return r.json(); })
        .then(onSuccess)
        .catch(onError);
}

function apiSubmitScore(payload, onSuccess, onError) {
    fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
    })
        .then(function (r) { return r.json(); })
        .then(onSuccess)
        .catch(onError);
}

function apiFetchLeaderboard(dayId, itemCount, onSuccess, onError) {
    var url = GAS_URL + '?day=' + dayId + '&itemCount=' + itemCount + '&nocache=' + Date.now();
    fetch(url)
        .then(function (r) { return r.json(); })
        .then(onSuccess)
        .catch(onError);
}
