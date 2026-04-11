let Database = null;
  try { Database = require('better-sqlite3'); } catch { Database = null; }
  const path = require('path');

  let _backend = null;
  let _db = null;
  let _pg = null;
  let _ready = null;

  const cache = {
      settings: { data: null, time: 0, ttl: 30000 },
      sudoUsers: { data: null, time: 0, ttl: 60000 },
      bannedUsers: { data: null, time: 0, ttl: 60000 },
      groupSettings: new Map()
  };
  const GS_TTL = 60000;
  function isCacheValid(e) { return e.data !== null && (Date.now() - e.time) < e.ttl; }

  const _settingsListeners = [];
  const _sudoListeners = [];
  const _bannedListeners = [];
  function registerSettingsListener(fn) { _settingsListeners.push(fn); }
  function registerSudoListener(fn) { _sudoListeners.push(fn); }
  function registerBannedListener(fn) { _bannedListeners.push(fn); }
  function _notify(list) { list.forEach(fn => { try { fn(); } catch {} }); }
  function getBackend() { return _backend; }

  const SQLITE_SCHEMA = `
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
      CREATE TABLE IF NOT EXISTS warn_data (jid TEXT NOT NULL, user TEXT NOT NULL, warns INTEGER DEFAULT 0, PRIMARY KEY (jid, user));
      CREATE TABLE IF NOT EXISTS msg_store (
          id TEXT NOT NULL, jid TEXT NOT NULL, sender TEXT, message TEXT NOT NULL,
          timestamp INTEGER NOT NULL, PRIMARY KEY (id, jid)
      );
      CREATE INDEX IF NOT EXISTS idx_ch_num ON conversation_history(num);
      CREATE INDEX IF NOT EXISTS idx_ms_id ON msg_store(id);
      CREATE INDEX IF NOT EXISTS idx_ms_ts ON msg_store(timestamp);
  `;

  const PG_SCHEMA = [
      `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS group_settings (
          jid TEXT PRIMARY KEY, antidelete INTEGER DEFAULT 1, gcpresence INTEGER DEFAULT 0,
          events INTEGER DEFAULT 0, antidemote INTEGER DEFAULT 0, antipromote INTEGER DEFAULT 0,
          antilink TEXT DEFAULT 'off', antistatusmention TEXT DEFAULT 'off', antitag INTEGER DEFAULT 0,
          welcome INTEGER DEFAULT 0, goodbye INTEGER DEFAULT 0, warn_limit INTEGER DEFAULT 3
      )`,
      `CREATE TABLE IF NOT EXISTS conversation_history (
          id SERIAL PRIMARY KEY, num TEXT NOT NULL, role TEXT NOT NULL,
          message TEXT NOT NULL, timestamp BIGINT DEFAULT EXTRACT(epoch FROM NOW())::BIGINT
      )`,
      `CREATE TABLE IF NOT EXISTS sudo_users (num TEXT PRIMARY KEY)`,
      `CREATE TABLE IF NOT EXISTS banned_users (num TEXT PRIMARY KEY)`,
      `CREATE TABLE IF NOT EXISTS warn_data (jid TEXT NOT NULL, user TEXT NOT NULL, warns INTEGER DEFAULT 0, PRIMARY KEY (jid, user))`,
      `CREATE TABLE IF NOT EXISTS msg_store (
          id TEXT NOT NULL, jid TEXT NOT NULL, sender TEXT, message TEXT NOT NULL,
          timestamp BIGINT NOT NULL, PRIMARY KEY (id, jid)
      )`,
      `CREATE INDEX IF NOT EXISTS idx_ch_num ON conversation_history(num)`,
      `CREATE INDEX IF NOT EXISTS idx_ms_ts ON msg_store(timestamp)`
  ];

  function initSqlite() {
      _db = new Database(path.resolve('./whatsasena.db'));
      _db.pragma('journal_mode = WAL');
      _db.pragma('synchronous = NORMAL');
      _db.pragma('cache_size = -64000');
      _db.pragma('temp_store = MEMORY');
      _db.pragma('busy_timeout = 5000');
      _db.pragma('mmap_size = 268435456');
      _db.exec(SQLITE_SCHEMA);
      _backend = 'sqlite';
      console.log('✅ [DB] Using SQLite (better-sqlite3)');
  }

  async function tryInitPg() {
      try {
          const { Pool } = require('pg');
          const pool = new Pool({
              connectionString: process.env.DATABASE_URL,
              ssl: { rejectUnauthorized: false },
              connectionTimeoutMillis: 10000,
              max: 10
          });
          await Promise.race([
              pool.query('SELECT 1'),
              new Promise((_, rej) => setTimeout(() => rej(new Error('PG connect timeout')), 60000))
          ]);
          for (const sql of PG_SCHEMA) { try { await pool.query(sql); } catch {} }
          _pg = pool;
          _backend = 'pg';
          console.log('✅ [DB] Using Heroku PostgreSQL');
          return true;
      } catch (e) {
          console.log(`⚠️ [DB] PostgreSQL unavailable (${e.message}) — using SQLite`);
          return false;
      }
  }

  _ready = (async () => {
      if (process.env.DATABASE_URL) {
          const ok = await tryInitPg();
          if (!ok) {
              if (Database) initSqlite();
              else throw new Error('[DB] No DATABASE_URL and better-sqlite3 is not available. Set DATABASE_URL env var.');
          }
      } else {
          if (Database) initSqlite();
          else {
              console.log('⚠️ [DB] better-sqlite3 not available and no DATABASE_URL — attempting PG...');
              const ok = await tryInitPg();
              if (!ok) throw new Error('[DB] No working database backend. Install better-sqlite3 or set DATABASE_URL.');
          }
      }
  })();

  async function ensureReady() { await _ready; }

  async function qAll(sqlLite, sqlPg, params = []) {
      await ensureReady();
      if (_backend === 'pg') return (await _pg.query(sqlPg, params)).rows;
      return _db.prepare(sqlLite).all(...params);
  }

  async function qGet(sqlLite, sqlPg, params = []) {
      await ensureReady();
      if (_backend === 'pg') return (await _pg.query(sqlPg, params)).rows[0] || null;
      return _db.prepare(sqlLite).get(...params) || null;
  }

  async function qRun(sqlLite, sqlPg, params = []) {
      await ensureReady();
      if (_backend === 'pg') { await _pg.query(sqlPg, params); }
      else { _db.prepare(sqlLite).run(...params); }
  }

  async function initializeDatabase() { await ensureReady(); }

  async function getSettings() {
      if (isCacheValid(cache.settings)) return cache.settings.data;
      const rows = await qAll(
          'SELECT key, value FROM settings',
          'SELECT key, value FROM settings'
      );
      const defaults = {
          prefix: '.', mode: 'public', botname: 'TOXIC-MD', startmessage: true,
          chatbotpm: false, autoview: false, autoread: false, antidelete: false, stealth: false,
          autoai: false, toxicagent: false, anticall: false
      };
      const s = { ...defaults };
      for (const r of rows) {
          try { s[r.key] = JSON.parse(r.value); } catch { s[r.key] = r.value; }
      }
      cache.settings.data = s;
      cache.settings.time = Date.now();
      return s;
  }

  async function updateSetting(key, value) {
      const v = JSON.stringify(value);
      await qRun(
          'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
          'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
          [key, v]
      );
      cache.settings.data = null;
      _notify(_settingsListeners);
  }

  async function getGroupSettings(jid) {
      const cached = cache.groupSettings.get(jid);
      if (cached && (Date.now() - cached.time) < GS_TTL) return cached.data;
      const row = await qGet(
          'SELECT * FROM group_settings WHERE jid = ?',
          'SELECT * FROM group_settings WHERE jid = $1',
          [jid]
      );
      const data = row ? {
          antidelete: !!row.antidelete, gcpresence: !!row.gcpresence, events: !!row.events,
          antidemote: !!row.antidemote, antipromote: !!row.antipromote, antilink: row.antilink || 'off',
          antistatusmention: row.antistatusmention || 'off', antitag: !!row.antitag,
          welcome: !!row.welcome, goodbye: !!row.goodbye, warn_limit: row.warn_limit || 3
      } : {
          antidelete: true, gcpresence: false, events: false, antidemote: false, antipromote: false,
          antilink: 'off', antistatusmention: 'off', antitag: false, welcome: false, goodbye: false, warn_limit: 3
      };
      cache.groupSettings.set(jid, { data, time: Date.now() });
      return data;
  }

  async function updateGroupSetting(jid, key, value) {
      await ensureReady();
      if (_backend === 'pg') {
          await _pg.query('INSERT INTO group_settings (jid) VALUES ($1) ON CONFLICT (jid) DO NOTHING', [jid]);
          await _pg.query(`UPDATE group_settings SET ${key} = $1 WHERE jid = $2`, [value, jid]);
      } else {
          _db.prepare('INSERT OR IGNORE INTO group_settings (jid) VALUES (?)').run(jid);
          _db.prepare(`UPDATE group_settings SET ${key} = ? WHERE jid = ?`).run(value, jid);
      }
      cache.groupSettings.delete(jid);
  }

  async function banUser(num) {
      await qRun(
          'INSERT OR IGNORE INTO banned_users (num) VALUES (?)',
          'INSERT INTO banned_users (num) VALUES ($1) ON CONFLICT DO NOTHING',
          [num]
      );
      cache.bannedUsers.data = null;
      _notify(_bannedListeners);
  }

  async function unbanUser(num) {
      await qRun('DELETE FROM banned_users WHERE num = ?', 'DELETE FROM banned_users WHERE num = $1', [num]);
      cache.bannedUsers.data = null;
      _notify(_bannedListeners);
  }

  async function getBannedUsers() {
      if (isCacheValid(cache.bannedUsers)) return cache.bannedUsers.data;
      const rows = await qAll('SELECT num FROM banned_users', 'SELECT num FROM banned_users');
      const data = rows.map(r => r.num);
      cache.bannedUsers.data = data;
      cache.bannedUsers.time = Date.now();
      return data;
  }

  async function addSudoUser(num) {
      await qRun(
          'INSERT OR IGNORE INTO sudo_users (num) VALUES (?)',
          'INSERT INTO sudo_users (num) VALUES ($1) ON CONFLICT DO NOTHING',
          [num]
      );
      cache.sudoUsers.data = null;
      _notify(_sudoListeners);
  }

  async function removeSudoUser(num) {
      await qRun('DELETE FROM sudo_users WHERE num = ?', 'DELETE FROM sudo_users WHERE num = $1', [num]);
      cache.sudoUsers.data = null;
      _notify(_sudoListeners);
  }

  async function getSudoUsers() {
      if (isCacheValid(cache.sudoUsers)) return cache.sudoUsers.data;
      const rows = await qAll('SELECT num FROM sudo_users', 'SELECT num FROM sudo_users');
      const data = rows.map(r => r.num);
      cache.sudoUsers.data = data;
      cache.sudoUsers.time = Date.now();
      return data;
  }

  async function getConversationHistory(num, limit = 20) {
      const rows = await qAll(
          'SELECT role, message FROM conversation_history WHERE num = ? ORDER BY timestamp DESC LIMIT ?',
          'SELECT role, message FROM conversation_history WHERE num = $1 ORDER BY timestamp DESC LIMIT $2',
          [num, limit]
      );
      return rows.reverse();
  }

  async function addConversationMessage(num, role, message) {
      await qRun(
          'INSERT INTO conversation_history (num, role, message) VALUES (?, ?, ?)',
          'INSERT INTO conversation_history (num, role, message) VALUES ($1, $2, $3)',
          [num, role, message]
      );
      if (_backend === 'sqlite') {
          _db.prepare('DELETE FROM conversation_history WHERE num = ? AND id NOT IN (SELECT id FROM conversation_history WHERE num = ? ORDER BY timestamp DESC LIMIT 50)').run(num, num);
      } else {
          _pg.query('DELETE FROM conversation_history WHERE num = $1 AND id NOT IN (SELECT id FROM conversation_history WHERE num = $1 ORDER BY timestamp DESC LIMIT 50)', [num]).catch(() => {});
      }
  }

  async function clearConversationHistory(num) {
      await qRun(
          'DELETE FROM conversation_history WHERE num = ?',
          'DELETE FROM conversation_history WHERE num = $1',
          [num]
      );
  }

  function clearOldConversationHistory(hoursOld = 5) {
      const cutoff = Math.floor(Date.now() / 1000) - hoursOld * 3600;
      if (_backend === 'pg') {
          _pg.query('DELETE FROM conversation_history WHERE timestamp < $1', [cutoff]).catch(() => {});
      } else if (_db) {
          try { _db.prepare('DELETE FROM conversation_history WHERE timestamp < ?').run(cutoff); } catch {}
      }
  }

  async function getWarnCount(jid, user) {
      const row = await qGet(
          'SELECT warns FROM warn_data WHERE jid = ? AND user = ?',
          'SELECT warns FROM warn_data WHERE jid = $1 AND user = $2',
          [jid, user]
      );
      return row ? row.warns : 0;
  }

  async function addWarn(jid, user) {
      try {
          const row = await qGet(
              'SELECT warns FROM warn_data WHERE jid = ? AND user = ?',
              'SELECT warns FROM warn_data WHERE jid = $1 AND user = $2',
              [jid, user]
          );
          if (row) {
              await qRun(
                  'UPDATE warn_data SET warns = warns + 1 WHERE jid = ? AND user = ?',
                  'UPDATE warn_data SET warns = warns + 1 WHERE jid = $1 AND user = $2',
                  [jid, user]
              );
              return row.warns + 1;
          }
          await qRun(
              'INSERT INTO warn_data (jid, user, warns) VALUES (?, ?, 1)',
              'INSERT INTO warn_data (jid, user, warns) VALUES ($1, $2, 1)',
              [jid, user]
          );
          return 1;
      } catch { return 0; }
  }

  async function resetWarn(jid, user) {
      await qRun(
          'DELETE FROM warn_data WHERE jid = ? AND user = ?',
          'DELETE FROM warn_data WHERE jid = $1 AND user = $2',
          [jid, user]
      );
  }

  async function setWarnLimit(jid, limit) {
      await updateGroupSetting(jid, 'warn_limit', parseInt(limit) || 3);
  }

  async function getWarnLimit(jid) {
      const gs = await getGroupSettings(jid);
      return gs.warn_limit || 3;
  }

  async function saveMessage(id, jid, sender, messageObj) {
      await qRun(
          'INSERT OR REPLACE INTO msg_store (id, jid, sender, message, timestamp) VALUES (?, ?, ?, ?, ?)',
          'INSERT INTO msg_store (id, jid, sender, message, timestamp) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id, jid) DO UPDATE SET message = $4, timestamp = $5',
          [id, jid, sender || '', JSON.stringify(messageObj), Date.now()]
      );
  }

  async function getMessage(id) {
      const row = await qGet(
          'SELECT * FROM msg_store WHERE id = ? LIMIT 1',
          'SELECT * FROM msg_store WHERE id = $1 LIMIT 1',
          [id]
      );
      if (!row) return null;
      try { return { id: row.id, jid: row.jid, sender: row.sender, message: JSON.parse(row.message), timestamp: row.timestamp }; }
      catch { return null; }
  }

  async function deleteMessage(id, jid) {
      await qRun(
          'DELETE FROM msg_store WHERE id = ? AND jid = ?',
          'DELETE FROM msg_store WHERE id = $1 AND jid = $2',
          [id, jid]
      );
  }

  async function cleanupOldMsgStore(maxAgeMs = 12 * 60 * 60 * 1000) {
      const cutoff = Date.now() - maxAgeMs;
      await qRun(
          'DELETE FROM msg_store WHERE timestamp < ?',
          'DELETE FROM msg_store WHERE timestamp < $1',
          [cutoff]
      );
  }

  setInterval(() => cleanupOldMsgStore(), 12 * 60 * 60 * 1000);
  setInterval(() => clearOldConversationHistory(1), 60 * 60 * 1000);

  module.exports = {
      get db() { return _db; },
      getBackend,
      registerSettingsListener, registerSudoListener, registerBannedListener,
      initializeDatabase, getSettings, updateSetting,
      getGroupSettings, updateGroupSetting,
      banUser, unbanUser, getBannedUsers,
      addSudoUser, removeSudoUser, getSudoUsers,
      getConversationHistory, addConversationMessage, clearConversationHistory, clearOldConversationHistory,
      getWarnCount, addWarn, resetWarn, setWarnLimit, getWarnLimit,
      saveMessage, getMessage, deleteMessage, cleanupOldMsgStore
  };
  