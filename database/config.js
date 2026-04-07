const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.resolve('./whatsasena.db'));
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000');
db.pragma('temp_store = MEMORY');
db.pragma('busy_timeout = 5000');
db.pragma('mmap_size = 268435456');

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
    CREATE TABLE IF NOT EXISTS msg_store (
        id TEXT NOT NULL, jid TEXT NOT NULL, sender TEXT,
        message TEXT NOT NULL, timestamp INTEGER NOT NULL,
        PRIMARY KEY (id, jid)
    );
    CREATE INDEX IF NOT EXISTS idx_msg_store_id ON msg_store(id);
    CREATE INDEX IF NOT EXISTS idx_msg_store_jid ON msg_store(jid);
    CREATE INDEX IF NOT EXISTS idx_msg_store_ts ON msg_store(timestamp);
`);

const stmts = {
    getAllSettings: db.prepare('SELECT key, value FROM settings'),
    upsertSetting: db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)'),
    getGroupSettings: db.prepare('SELECT * FROM group_settings WHERE jid = ?'),
    hasGroupSettings: db.prepare('SELECT jid FROM group_settings WHERE jid = ?'),
    insertGroupSettings: db.prepare('INSERT OR IGNORE INTO group_settings (jid) VALUES (?)'),
    insertBanned: db.prepare('INSERT OR IGNORE INTO banned_users (num) VALUES (?)'),
    deleteBanned: db.prepare('DELETE FROM banned_users WHERE num = ?'),
    getAllBanned: db.prepare('SELECT num FROM banned_users'),
    insertSudo: db.prepare('INSERT OR IGNORE INTO sudo_users (num) VALUES (?)'),
    deleteSudo: db.prepare('DELETE FROM sudo_users WHERE num = ?'),
    getAllSudo: db.prepare('SELECT num FROM sudo_users'),
    getConvHistory: db.prepare('SELECT role, message FROM conversation_history WHERE num = ? ORDER BY timestamp DESC LIMIT ?'),
    insertConvMessage: db.prepare('INSERT INTO conversation_history (num, role, message) VALUES (?, ?, ?)'),
    pruneConvHistory: db.prepare('DELETE FROM conversation_history WHERE num = ? AND id NOT IN (SELECT id FROM conversation_history WHERE num = ? ORDER BY timestamp DESC LIMIT 50)'),
    deleteConvHistory: db.prepare('DELETE FROM conversation_history WHERE num = ?'),
    deleteOldConvHistory: db.prepare('DELETE FROM conversation_history WHERE timestamp < ?'),
    getWarn: db.prepare('SELECT warns FROM warn_data WHERE jid = ? AND user = ?'),
    insertWarn: db.prepare('INSERT INTO warn_data (jid, user, warns) VALUES (?, ?, 1)'),
    incrementWarn: db.prepare('UPDATE warn_data SET warns = warns + 1 WHERE jid = ? AND user = ?'),
    deleteWarn: db.prepare('DELETE FROM warn_data WHERE jid = ? AND user = ?'),
    saveMsgStore: db.prepare('INSERT OR REPLACE INTO msg_store (id, jid, sender, message, timestamp) VALUES (?, ?, ?, ?, ?)'),
    getMsgById: db.prepare('SELECT * FROM msg_store WHERE id = ? LIMIT 1'),
    deleteMsgStore: db.prepare('DELETE FROM msg_store WHERE id = ? AND jid = ?'),
    cleanupMsgStore: db.prepare('DELETE FROM msg_store WHERE timestamp < ?'),
};

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
        const rows = stmts.getAllSettings.all();
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
        stmts.upsertSetting.run(key, JSON.stringify(value));
        cache.settings.data = null; cache.settings.time = 0;
    } catch (e) { console.error('Error updating setting:', e); }
}

async function getGroupSettings(jid) {
    const cached = cache.groupSettings.get(jid);
    if (cached && (Date.now() - cached.time) < GROUP_SETTINGS_TTL) return cached.data;
    try {
        const row = stmts.getGroupSettings.get(jid);
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
        stmts.insertGroupSettings.run(jid);
        db.prepare(`UPDATE group_settings SET ${key} = ? WHERE jid = ?`).run(value, jid);
        cache.groupSettings.delete(jid);
    } catch (e) { console.error('Error updating group setting:', e); }
}

async function banUser(num) {
    try { stmts.insertBanned.run(num); cache.bannedUsers.data = null; cache.bannedUsers.time = 0; }
    catch (e) { console.error('Error banning user:', e); }
}

async function unbanUser(num) {
    try { stmts.deleteBanned.run(num); cache.bannedUsers.data = null; cache.bannedUsers.time = 0; }
    catch (e) { console.error('Error unbanning user:', e); }
}

async function addSudoUser(num) {
    try { stmts.insertSudo.run(num); cache.sudoUsers.data = null; cache.sudoUsers.time = 0; }
    catch (e) { console.error('Error adding sudo:', e); }
}

async function removeSudoUser(num) {
    try { stmts.deleteSudo.run(num); cache.sudoUsers.data = null; cache.sudoUsers.time = 0; }
    catch (e) { console.error('Error removing sudo:', e); }
}

async function getSudoUsers() {
    if (isCacheValid(cache.sudoUsers)) return cache.sudoUsers.data;
    try {
        const rows = stmts.getAllSudo.all();
        const users = rows.map(r => r.num);
        cache.sudoUsers = { data: users, time: Date.now(), ttl: 60000 };
        return users;
    } catch (e) { console.error('Error fetching sudo users:', e); return cache.sudoUsers.data || []; }
}

async function getBannedUsers() {
    if (isCacheValid(cache.bannedUsers)) return cache.bannedUsers.data;
    try {
        const rows = stmts.getAllBanned.all();
        const users = rows.map(r => r.num);
        cache.bannedUsers = { data: users, time: Date.now(), ttl: 60000 };
        return users;
    } catch (e) { console.error('Error fetching banned users:', e); return cache.bannedUsers.data || []; }
}

async function getConversationHistory(num, limit = 20) {
    try { return stmts.getConvHistory.all(num, limit).reverse(); }
    catch { return []; }
}

async function addConversationMessage(num, role, message) {
    try {
        stmts.insertConvMessage.run(num, role, message);
        stmts.pruneConvHistory.run(num, num);
    } catch {}
}

async function clearConversationHistory(num) {
    try { stmts.deleteConvHistory.run(num); } catch {}
}

function clearOldConversationHistory(hoursOld = 5) {
    try {
        const cutoff = Math.floor(Date.now() / 1000) - (hoursOld * 3600);
        const result = stmts.deleteOldConvHistory.run(cutoff);
        if (result.changes > 0) console.log('Cleared', result.changes, 'old conversation records');
    } catch {}
}

async function getWarnCount(jid, user) {
    try { const r = stmts.getWarn.get(jid, user); return r ? r.warns : 0; } catch { return 0; }
}

async function addWarn(jid, user) {
    try {
        const r = stmts.getWarn.get(jid, user);
        if (r) { stmts.incrementWarn.run(jid, user); return r.warns + 1; }
        stmts.insertWarn.run(jid, user);
        return 1;
    } catch { return 0; }
}

async function resetWarn(jid, user) {
    try { stmts.deleteWarn.run(jid, user); } catch {}
}

function saveMessage(id, jid, sender, messageObj) {
    try { stmts.saveMsgStore.run(id, jid, sender || '', JSON.stringify(messageObj), Date.now()); }
    catch (e) { console.error('❌ [MSG_STORE] Save error:', e.message); }
}

function getMessage(id) {
    try {
        const row = stmts.getMsgById.get(id);
        if (!row) return null;
        return { id: row.id, jid: row.jid, sender: row.sender, message: JSON.parse(row.message), timestamp: row.timestamp };
    } catch (e) { return null; }
}

function deleteMessage(id, jid) {
    try { stmts.deleteMsgStore.run(id, jid); } catch {}
}

function cleanupOldMsgStore(maxAgeMs = 12 * 60 * 60 * 1000) {
    try { stmts.cleanupMsgStore.run(Date.now() - maxAgeMs); } catch {}
}

setInterval(() => cleanupOldMsgStore(), 12 * 60 * 60 * 1000);

module.exports = {
    db, initializeDatabase, getSettings, updateSetting,
    getGroupSettings, updateGroupSetting,
    banUser, unbanUser, getBannedUsers,
    addSudoUser, removeSudoUser, getSudoUsers,
    getConversationHistory, addConversationMessage, clearConversationHistory,
    getWarnCount, addWarn, resetWarn,
    clearOldConversationHistory,
    saveMessage, getMessage, deleteMessage, cleanupOldMsgStore
};
