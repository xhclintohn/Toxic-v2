const fs = require('fs');
  const path = require('path');
  const fetch = require('node-fetch');

  const _keys = (() => { try { return require('../keys'); } catch { return {}; } })();
  const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || _keys.UPSTASH_REDIS_REST_URL || '';
  const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || _keys.UPSTASH_REDIS_REST_TOKEN || '';
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || _keys.GITHUB_TOKEN || '';
  const BACKUP_KEY = 'toxic_db_backup';
  const LOCAL_BACKUP_PATH = path.join(__dirname, '..', 'database', 'db_backup.json');
  const GIST_ID_FILE = path.join(__dirname, '..', 'database', '.gist_id');

  function hasUpstash() {
      return !!(UPSTASH_URL && UPSTASH_TOKEN);
  }

  function hasGitHub() {
      return !!(GITHUB_TOKEN);
  }

  function getSavedGistId() {
      try { return fs.readFileSync(GIST_ID_FILE, 'utf8').trim(); } catch { return ''; }
  }

  function saveGistId(id) {
      try { fs.writeFileSync(GIST_ID_FILE, id, 'utf8'); } catch {}
  }

  async function getOrCreateGist() {
      let gistId = process.env.GIST_ID || getSavedGistId();
      if (gistId) return gistId;
      try {
          const res = await fetch('https://api.github.com/gists', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json', 'User-Agent': 'Toxic-MD-Bot' },
              body: JSON.stringify({ description: 'Toxic-MD DB Backup', public: false, files: { 'toxic-db.json': { content: '{}' } } })
          });
          if (!res.ok) return '';
          const gist = await res.json();
          gistId = gist.id;
          saveGistId(gistId);
          console.log(`✅ [DB BACKUP] Created new Gist: ${gistId}`);
          return gistId;
      } catch { return ''; }
  }

  async function upstashSet(value) {
      const res = await fetch(`${UPSTASH_URL}/set/${BACKUP_KEY}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${UPSTASH_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(JSON.stringify(value))
      });
      return res.ok;
  }

  async function upstashGet() {
      const res = await fetch(`${UPSTASH_URL}/get/${BACKUP_KEY}`, {
          headers: { 'Authorization': `Bearer ${UPSTASH_TOKEN}` }
      });
      if (!res.ok) return null;
      const d = await res.json();
      if (!d.result) return null;
      try { return JSON.parse(d.result); } catch { return null; }
  }

  async function collectDbData(db) {
      const settings = {};
      for (const row of db.prepare('SELECT key, value FROM settings').all()) settings[row.key] = row.value;
      const banned = db.prepare('SELECT num FROM banned_users').all().map(r => r.num);
      const sudo = db.prepare('SELECT num FROM sudo_users').all().map(r => r.num);
      const warns = db.prepare('SELECT jid, user, warns FROM warn_data').all();
      const groups = db.prepare('SELECT * FROM group_settings').all();
      return { settings, banned, sudo, warns, groups, backed_up_at: new Date().toISOString() };
  }

  function restoreDbData(db, data) {
      if (data.settings && typeof data.settings === 'object') {
          const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
          db.transaction((entries) => { for (const [k, v] of entries) upsert.run(k, String(v)); })(Object.entries(data.settings));
          console.log(`✅ [DB RESTORE] ${Object.keys(data.settings).length} settings`);
      }
      if (Array.isArray(data.banned) && data.banned.length) {
          const ins = db.prepare('INSERT OR IGNORE INTO banned_users (num) VALUES (?)');
          db.transaction((items) => { for (const n of items) ins.run(n); })(data.banned);
          console.log(`✅ [DB RESTORE] ${data.banned.length} banned users`);
      }
      if (Array.isArray(data.sudo) && data.sudo.length) {
          const ins = db.prepare('INSERT OR IGNORE INTO sudo_users (num) VALUES (?)');
          db.transaction((items) => { for (const n of items) ins.run(n); })(data.sudo);
          console.log(`✅ [DB RESTORE] ${data.sudo.length} sudo users`);
      }
      if (Array.isArray(data.warns) && data.warns.length) {
          const ins = db.prepare('INSERT OR REPLACE INTO warn_data (jid, user, warns) VALUES (?, ?, ?)');
          db.transaction((items) => { for (const w of items) ins.run(w.jid, w.user, w.warns); })(data.warns);
          console.log(`✅ [DB RESTORE] ${data.warns.length} warn records`);
      }
      if (Array.isArray(data.groups) && data.groups.length) {
          const cols = ['jid','antidelete','gcpresence','events','antidemote','antipromote','antilink','antistatusmention','antitag','welcome','goodbye','warn_limit'];
          const ins = db.prepare(`INSERT OR REPLACE INTO group_settings (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`);
          db.transaction((items) => { for (const g of items) ins.run(cols.map(c => g[c] ?? null)); })(data.groups);
          console.log(`✅ [DB RESTORE] ${data.groups.length} group configs`);
      }
  }

  function saveLocalBackup(data) {
      try {
          const dir = path.dirname(LOCAL_BACKUP_PATH);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(LOCAL_BACKUP_PATH, JSON.stringify(data, null, 2), 'utf8');
      } catch {}
  }

  function loadLocalBackup() {
      try {
          if (!fs.existsSync(LOCAL_BACKUP_PATH)) return null;
          return JSON.parse(fs.readFileSync(LOCAL_BACKUP_PATH, 'utf8'));
      } catch { return null; }
  }

  async function backupToUpstash(db) {
      if (!hasUpstash()) return false;
      try {
          const data = await collectDbData(db);
          const ok = await upstashSet(data);
          if (ok) console.log(`✅ [DB BACKUP] Upstash @ ${new Date().toLocaleTimeString()}`);
          return ok;
      } catch (e) {
          console.error('❌ [DB BACKUP] Upstash:', e.message);
          return false;
      }
  }

  async function restoreFromUpstash(db) {
      if (!hasUpstash()) return false;
      try {
          const data = await upstashGet();
          if (!data) return false;
          restoreDbData(db, data);
          console.log(`🎉 [DB RESTORE] From Upstash (at ${data.backed_up_at || '?'})`);
          return true;
      } catch (e) {
          console.error('❌ [DB RESTORE] Upstash:', e.message);
          return false;
      }
  }

  async function backupToGist(db) {
      if (!hasGitHub()) return false;
      try {
          const gistId = await getOrCreateGist();
          if (!gistId) return false;
          const data = await collectDbData(db);
          saveLocalBackup(data);
          const res = await fetch(`https://api.github.com/gists/${gistId}`, {
              method: 'PATCH',
              headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json', 'User-Agent': 'Toxic-MD-Bot' },
              body: JSON.stringify({ files: { 'toxic-db.json': { content: JSON.stringify(data, null, 2) } } })
          });
          if (res.ok) console.log(`✅ [DB BACKUP] Gist @ ${new Date().toLocaleTimeString()}`);
          return res.ok;
      } catch (e) {
          console.error('❌ [DB BACKUP] Gist:', e.message);
          return false;
      }
  }

  async function restoreFromGist(db) {
      if (!hasGitHub()) return false;
      try {
          const gistId = await getOrCreateGist();
          if (!gistId) return false;
          const res = await fetch(`https://api.github.com/gists/${gistId}`, {
              headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Toxic-MD-Bot' }
          });
          if (!res.ok) return false;
          const gist = await res.json();
          const content = gist.files?.['toxic-db.json']?.content;
          if (!content || content === '{}') return false;
          const data = JSON.parse(content);
          restoreDbData(db, data);
          console.log(`🎉 [DB RESTORE] From Gist (at ${data.backed_up_at || '?'})`);
          return true;
      } catch (e) {
          console.error('❌ [DB RESTORE] Gist:', e.message);
          return false;
      }
  }

  async function backupToLocal(db) {
      try {
          const data = await collectDbData(db);
          saveLocalBackup(data);
          console.log(`✅ [DB BACKUP] Local JSON @ ${new Date().toLocaleTimeString()}`);
          return true;
      } catch { return false; }
  }

  function restoreFromLocal(db) {
      try {
          const data = loadLocalBackup();
          if (!data) return false;
          restoreDbData(db, data);
          console.log(`🎉 [DB RESTORE] From local JSON (at ${data.backed_up_at || '?'})`);
          return true;
      } catch { return false; }
  }

  async function backupDb(db) {
      if (hasUpstash()) return backupToUpstash(db);
      if (hasGitHub()) return backupToGist(db);
      return backupToLocal(db);
  }

  async function restoreDb(db) {
      if (hasUpstash()) {
          const ok = await restoreFromUpstash(db);
          if (ok) return true;
      }
      if (hasGitHub()) {
          const ok = await restoreFromGist(db);
          if (ok) return true;
      }
      return restoreFromLocal(db);
  }

  function startBackupInterval(db) {
      const source = hasUpstash() ? 'Upstash Redis' : hasGitHub() ? 'GitHub Gist (auto)' : 'Local JSON';
      setInterval(() => backupDb(db), 5 * 60 * 1000);
      console.log(`🔄 [DB BACKUP] Auto-backup every 5min via ${source}`);
      const shutdown = async () => {
          console.log('🔄 [DB BACKUP] Saving before shutdown...');
          await backupDb(db);
          process.exit(0);
      };
      process.on('SIGTERM', shutdown);
      process.on('SIGINT', shutdown);
  }

  module.exports = { backupDb, restoreDb, startBackupInterval, backupToUpstash, restoreFromUpstash, backupToGist, restoreFromGist };
  