const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.resolve('./whatsasena.db'));
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000');
db.pragma('temp_store = MEMORY');
db.exec(`
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS group_settings (
        jid TEXT PRIMARY KEY, antidelete INTEGER DEFAULT 1, gcpresence INTEGER DEFAULT 0,
        events INTEGER DEFAULT 0, antidemote INTEGER DEFAULT 0, antipromote INTEGER DEFAULT 0,
        antilink TEXT DEFAULT 'off', antistatusmention TEXT DEFAULT 'off', antitag INTEGER DEFAULT 0,
        welcome INTEGER DEFAULT 0, goodbye INTEGER DEFAULT 0, warn_limit INTEGER DEFAULT 3
    );
    CREATE TABLE IF NOT EXISTS conversation_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT, num TEXT NOT NULL, role TEXT NOT NULL,
        message TEXT NOT NULL, timestamp INTEGER DEFAULT (strftime('%s','now'))
    );
    CREATE TABLE IF NOT EXISTS sudo_users (num TEXT PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS banned_users (num TEXT PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS users (num TEXT PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS warn_data (jid TEXT NOT NULL, user TEXT NOT NULL, warns INTEGER DEFAULT 0, PRIMARY KEY (jid, user));
`);

const cache = {
    settings: { data: null, time: 0, ttl: 30000 },
    sudoUsers: { data: null, time: 0, ttl: 60000 },
    bannedUsers: { data: null, time: 0, ttl: 60000 },
    groupSettings: new Map()
};
const GROUP_SETTINGS_TTL = 60000;

function isCacheValid(e) { return e.data !== null && (Date.now() - e.time) < e.ttl; }

async function initializeDatabase() {}

async function getSettings() {
    if (isCacheValid(cache.settings)) return cache.settings.data;
    try {
        const rows = db.prepare('SELECT key, value FROM settings').all();
        const s = {};
        for (const row of rows) { try { s[row.key] = JSON.parse(row.value); } catch { s[row.key] = row.value; } }
        const defaults = {
            prefix: '.', mode: 'public', gcpresence: false, antitag: false, antidelete: true,
            antilink: 'off', chatbotpm: false, packname: 'Toxic-MD', author: 'xh_clinton',
            multiprefix: false, stealth: false, startmessage: true, autoview: false,
            autoai: false, antistatusmention: 'off', warn_limit: 3
        };
        const result = { ...defaults, ...s };
        cache.settings = { data: result, time: Date.now(), ttl: 30000 };
        return result;
    } catch (error) {
        console.error('Error fetching settings:', error);
        if (cache.settings.data) return cache.settings.data;
        return { prefix: '.', mode: 'public', gcpresence: false, antitag: false, antidelete: true, antilink: 'off', chatbotpm: false, packname: 'Toxic-MD', author: 'xh_clinton', multiprefix: false, stealth: false, startmessage: true, autoview: false, autoai: false };
    }
}

async function updateSetting(key, value) {
    try {
        db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
        cache.settings.data = null; cache.settings.time = 0;
    } catch (e) { console.error('Error updating setting:', e); }
}

async function getGroupSettings(jid) {
    const cached = cache.groupSettings.get(jid);
    if (cached && (Date.now() - cached.time) < GROUP_SETTINGS_TTL) return cached.data;
    try {
        const row = db.prepare('SELECT * FROM group_settings WHERE jid = ?').get(jid);
        const result = row ? {
            antidelete: !!row.antidelete, gcpresence: !!row.gcpresence, events: !!row.events,
            antidemote: !!row.antidemote, antipromote: !!row.antipromote, antilink: row.antilink || 'off',
            antistatusmention: row.antistatusmention || 'off', antitag: !!row.antitag,
            welcome: !!row.welcome, goodbye: !!row.goodbye, warn_limit: row.warn_limit || 3
        } : { antidelete: true, gcpresence: false, events: false, antidemote: false, antipromote: false, antilink: 'off', antistatusmention: 'off', antitag: false, welcome: false, goodbye: false, warn_limit: 3 };
        if (cache.groupSettings.size > 500) cache.groupSettings.delete(cache.groupSettings.keys().next().value);
        cache.groupSettings.set(jid, { data: result, time: Date.now() });
        return result;
    } catch (e) {
        console.error('Error fetching group settings:', e);
        return { antidelete: true, gcpresence: false, events: false, antidemote: false, antipromote: false, antitag: false, antilink: 'off', antistatusmention: 'off', welcome: false, goodbye: false, warn_limit: 3 };
    }
}

async function updateGroupSetting(jid, key, value) {
    try {
        const existing = db.prepare('SELECT jid FROM group_settings WHERE jid = ?').get(jid);
        if (existing) { db.prepare(`UPDATE group_settings SET ${key} = ? WHERE jid = ?`).run(value, jid); }
        else { db.prepare(`INSERT INTO group_settings (jid, ${key}) VALUES (?, ?)`).run(jid, value); }
        cache.groupSettings.delete(jid);
    } catch (e) { console.error('Error updating group setting:', e); }
}

async function banUser(num) {
    try { db.prepare('INSERT OR IGNORE INTO banned_users (num) VALUES (?)').run(num); cache.bannedUsers.data = null; cache.bannedUsers.time = 0; }
    catch (e) { console.error('Error banning user:', e); }
}

async function unbanUser(num) {
    try { db.prepare('DELETE FROM banned_users WHERE num = ?').run(num); cache.bannedUsers.data = null; cache.bannedUsers.time = 0; }
    catch (e) { console.error('Error unbanning user:', e); }
}

async function addSudoUser(num) {
    try { db.prepare('INSERT OR IGNORE INTO sudo_users (num) VALUES (?)').run(num); cache.sudoUsers.data = null; cache.sudoUsers.time = 0; }
    catch (e) { console.error('Error adding sudo:', e); }
}

async function removeSudoUser(num) {
    try { db.prepare('DELETE FROM sudo_users WHERE num = ?').run(num); cache.sudoUsers.data = null; cache.sudoUsers.time = 0; }
    catch (e) { console.error('Error removing sudo:', e); }
}

async function getSudoUsers() {
    if (isCacheValid(cache.sudoUsers)) return cache.sudoUsers.data;
    try {
        const rows = db.prepare('SELECT num FROM sudo_users').all();
        const users = rows.map(r => r.num);
        cache.sudoUsers = { data: users, time: Date.now(), ttl: 60000 };
        return users;
    } catch (e) { console.error('Error fetching sudo users:', e); return cache.sudoUsers.data || []; }
}

async function getBannedUsers() {
    if (isCacheValid(cache.bannedUsers)) return cache.bannedUsers.data;
    try {
        const rows = db.prepare('SELECT num FROM banned_users').all();
        const users = rows.map(r => r.num);
        cache.bannedUsers = { data: users, time: Date.now(), ttl: 60000 };
        return users;
    } catch (e) { console.error('Error fetching banned users:', e); return cache.bannedUsers.data || []; }
}

async function getConversationHistory(num, limit = 20) {
    try { return db.prepare('SELECT role, message FROM conversation_history WHERE num = ? ORDER BY timestamp DESC LIMIT ?').all(num, limit).reverse(); }
    catch { return []; }
}

async function addConversationMessage(num, role, message) {
    try {
        db.prepare('INSERT INTO conversation_history (num, role, message) VALUES (?, ?, ?)').run(num, role, message);
        const cnt = db.prepare('SELECT COUNT(*) as c FROM conversation_history WHERE num = ?').get(num);
        if (cnt.c > 50) db.prepare('DELETE FROM conversation_history WHERE num = ? AND id IN (SELECT id FROM conversation_history WHERE num = ? ORDER BY timestamp ASC LIMIT ?)').run(num, num, cnt.c - 50);
    } catch {}
}

async function clearConversationHistory(num) {
    try { db.prepare('DELETE FROM conversation_history WHERE num = ?').run(num); } catch {}
}

async function getWarnCount(jid, user) {
    try { const r = db.prepare('SELECT warns FROM warn_data WHERE jid = ? AND user = ?').get(jid, user); return r ? r.warns : 0; } catch { return 0; }
}

async function addWarn(jid, user) {
    try {
        const r = db.prepare('SELECT warns FROM warn_data WHERE jid = ? AND user = ?').get(jid, user);
        if (r) { db.prepare('UPDATE warn_data SET warns = warns + 1 WHERE jid = ? AND user = ?').run(jid, user); return r.warns + 1; }
        db.prepare('INSERT INTO warn_data (jid, user, warns) VALUES (?, ?, 1)').run(jid, user);
        return 1;
    } catch { return 0; }
}

async function resetWarn(jid, user) {
    try { db.prepare('DELETE FROM warn_data WHERE jid = ? AND user = ?').run(jid, user); } catch {}
}

module.exports = {
    db, initializeDatabase, getSettings, updateSetting,
    getGroupSettings, updateGroupSetting,
    banUser, unbanUser, getBannedUsers,
    addSudoUser, removeSudoUser, getSudoUsers,
    getConversationHistory, addConversationMessage, clearConversationHistory,
    getWarnCount, addWarn, resetWarn
};
