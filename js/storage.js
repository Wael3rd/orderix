// LocalStorage + cookie fallback helpers
export function setStorage(key, value) {
    try { localStorage.setItem(key, value); } catch(e) {}
    document.cookie = `${key}=${encodeURIComponent(value)}; max-age=31536000; path=/; SameSite=None; Secure`;
}
export function getStorage(key) {
    try { if (localStorage.getItem(key)) return localStorage.getItem(key); } catch(e) {}
    const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
    if (match) return decodeURIComponent(match[2]);
    return null;
}
