const { getSettings, getSudoUsers, getBannedUsers, registerSettingsListener, registerSudoListener, registerBannedListener } = require('../database/config');

const TTL = 300000;
const _DEFAULTS = { prefix: '.', mode: 'public', gcpresence: false, antitag: false, antidelete: true, antilink: 'off', chatbotpm: false, packname: 'Toxic-MD', author: 'xh_clinton', multiprefix: false, stealth: false, startmessage: true, autoview: false, autoai: false, toxicagent: false, warn_limit: 3, autobio: false, presence: 'online', autoread: false, autolike: false, anticall: false };

let _s = null, _sTime = 0, _sP = null;
let _su = null, _suTime = 0, _suP = null;
let _b = null, _bTime = 0, _bP = null;

async function getCachedSettings() {
    const now = Date.now();
    if (_s && (now - _sTime) < TTL) return _s;
    if (_sP) return _sP;
    _sP = (async () => {
        try { _s = await getSettings(); _sTime = Date.now(); } catch {}
        _sP = null;
        return _s || _DEFAULTS;
    })();
    return _sP;
}

async function getCachedSudo() {
    const now = Date.now();
    if (_su && (now - _suTime) < TTL) return _su;
    if (_suP) return _suP;
    _suP = (async () => {
        try { _su = await getSudoUsers(); _suTime = Date.now(); } catch {}
        _suP = null;
        return _su || [];
    })();
    return _suP;
}

async function getCachedBanned() {
    const now = Date.now();
    if (_b && (now - _bTime) < TTL) return _b;
    if (_bP) return _bP;
    _bP = (async () => {
        try { _b = await getBannedUsers(); _bTime = Date.now(); } catch {}
        _bP = null;
        return _b || [];
    })();
    return _bP;
}

function invalidateSettings() { _s = null; _sTime = 0; _sP = null; }
function invalidateSudo() { _su = null; _suTime = 0; _suP = null; }
function invalidateBanned() { _b = null; _bTime = 0; _bP = null; }

registerSettingsListener(invalidateSettings);
registerSudoListener(invalidateSudo);
registerBannedListener(invalidateBanned);

module.exports = { getCachedSettings, getCachedSudo, getCachedBanned, invalidateSettings, invalidateSudo, invalidateBanned };
