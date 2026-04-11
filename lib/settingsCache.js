const { getSettings, getSudoUsers, getBannedUsers, registerSettingsListener, registerSudoListener, registerBannedListener } = require('../database/config');

const TTL = 300000;
const _DEFAULTS = { prefix: '.', mode: 'public', gcpresence: false, antitag: false, antidelete: true, antilink: 'off', chatbotpm: false, packname: 'Toxic-MD', author: 'xh_clinton', multiprefix: false, stealth: false, startmessage: true, autoview: false, autoai: false, toxicagent: false, warn_limit: 3, autobio: false, presence: 'online', autoread: false, autolike: false, anticall: false };

let _s = null, _sTime = 0, _sP = null;
let _su = null, _suTime = 0, _suP = null;
let _b = null, _bTime = 0, _bP = null;

const _TIMEOUT_MS = 300;
function _withTimeout(p, fallback) {
    return Promise.race([p, new Promise(r => setTimeout(() => r(fallback), _TIMEOUT_MS))]);
}

async function getCachedSettings() {
    const now = Date.now();
    if (_s && (now - _sTime) < TTL) return _s;
    if (_sP) return _withTimeout(_sP, _DEFAULTS);
    _sP = (async () => {
        try { _s = await _withTimeout(getSettings(), null); _sTime = Date.now(); } catch {}
        _sP = null;
        return _s || _DEFAULTS;
    })();
    return _withTimeout(_sP, _DEFAULTS);
}

async function getCachedSudo() {
    const now = Date.now();
    if (_su && (now - _suTime) < TTL) return _su;
    if (_suP) return _withTimeout(_suP, []);
    _suP = (async () => {
        try { _su = await _withTimeout(getSudoUsers(), null); _suTime = Date.now(); } catch {}
        _suP = null;
        return _su || [];
    })();
    return _withTimeout(_suP, []);
}

async function getCachedBanned() {
    const now = Date.now();
    if (_b && (now - _bTime) < TTL) return _b;
    if (_bP) return _withTimeout(_bP, []);
    _bP = (async () => {
        try { _b = await _withTimeout(getBannedUsers(), null); _bTime = Date.now(); } catch {}
        _bP = null;
        return _b || [];
    })();
    return _withTimeout(_bP, []);
}

function invalidateSettings() { _s = null; _sTime = 0; _sP = null; }
function invalidateSudo() { _su = null; _suTime = 0; _suP = null; }
function invalidateBanned() { _b = null; _bTime = 0; _bP = null; }

registerSettingsListener(invalidateSettings);
registerSudoListener(invalidateSudo);
registerBannedListener(invalidateBanned);

// Keep caches warm — refresh every 60 seconds so the first message always hits cache
setInterval(() => {
    getCachedSettings().catch(() => {});
    getCachedSudo().catch(() => {});
    getCachedBanned().catch(() => {});
}, 60000);

// Synchronous read — always instant, returns cached value or defaults
function getCachedSettingsSync() { return _s || _DEFAULTS; }
function getCachedSudoSync() { return _su || []; }
function getCachedBannedSync() { return _b || []; }

module.exports = { getCachedSettings, getCachedSudo, getCachedBanned, getCachedSettingsSync, getCachedSudoSync, getCachedBannedSync, invalidateSettings, invalidateSudo, invalidateBanned };
