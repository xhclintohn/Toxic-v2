const fetch = require('node-fetch');

  const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
  const BACKUP_KEY = 'toxic_db_backup';

  function hasUpstash() {
      return !!(UPSTASH_URL && UPSTASH_TOKEN);
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

  function getGistConfig() {
      const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || (() => { try { return require('../keys').GITHUB_TOKEN; } catch { return ''; } })();
      const gistId = process.env.GIST_ID || '';
      return { token, gistId };
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
          const upsertMany = db.transaction((entries) => { for (const [k, v] of entries) upsert.run(k, String(v)); });
          upsertMany(Object.entries(data.settings));
          console.log(`✅ [DB RESTORE] Restored ${Object.keys(data.settings).length} settings`);
      }
      if (Array.isArray(data.banned) && data.banned.length) {
          const ins = db.prepare('INSERT OR IGNORE INTO banned_users (num) VALUES (?)');
          db.transaction((items) => { for (const n of items) ins.run(n); })(data.banned);
          console.log(`✅ [DB RESTORE] Restored ${data.banned.length} banned users`);
      }
      if (Array.isArray(data.sudo) && data.sudo.length) {
          const ins = db.prepare('INSERT OR IGNORE INTO sudo_users (num) VALUES (?)');
          db.transaction((items) => { for (const n of items) ins.run(n); })(data.sudo);
          console.log(`✅ [DB RESTORE] Restored ${data.sudo.length} sudo users`);
      }
      if (Array.isArray(data.warns) && data.warns.length) {
          const ins = db.prepare('INSERT OR REPLACE INTO warn_data (jid, user, warns) VALUES (?, ?, ?)');
          db.transaction((items) => { for (const w of items) ins.run(w.jid, w.user, w.warns); })(data.warns);
          console.log(`✅ [DB RESTORE] Restored ${data.warns.length} warn records`);
      }
      if (Array.isArray(data.groups) && data.groups.length) {
          const cols = ['jid', 'antidelete', 'gcpresence', 'events', 'antidemote', 'antipromote', 'antilink', 'antistatusmention', 'antitag', 'welcome', 'goodbye', 'warn_limit'];
          const ins = db.prepare(`INSERT OR REPLACE INTO group_settings (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`);
          db.transaction((items) => { for (const g of items) ins.run(cols.map(c => g[c] ?? null)); })(data.groups);
          console.log(`✅ [DB RESTORE] Restored ${data.groups.length} group configs`);
      }
  }

  async function backupToUpstash(db) {
      if (!hasUpstash()) return false;
      try {
          const data = await collectDbData(db);
          const ok = await upstashSet(data);
          if (ok) console.log(`✅ [DB BACKUP] Backed up to Upstash Redis at ${new Date().toLocaleTimeString()}`);
          return ok;
      } catch (e) {
          console.error('❌ [DB BACKUP] Upstash error:', e.message);
          return false;
      }
  }

  async function restoreFromUpstash(db) {
      if (!hasUpstash()) return false;
      try {
          const data = await upstashGet();
          if (!data) { console.log('ℹ️ [DB RESTORE] No backup in Upstash yet'); return false; }
          restoreDbData(db, data);
          console.log(`🎉 [DB RESTORE] Restored from Upstash (backed up: ${data.backed_up_at || 'unknown'})`);
          return true;
      } catch (e) {
          console.error('❌ [DB RESTORE] Upstash restore error:', e.message);
          return false;
      }
  }

  async function backupToGist(db) {
      const { token, gistId } = getGistConfig();
      if (!token || !gistId) return;
      try {
          const data = await collectDbData(db);
          const payload = JSON.stringify(data, null, 2);
          const res = await fetch(`https://api.github.com/gists/${gistId}`, {
              method: 'PATCH',
              headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json', 'User-Agent': 'Toxic-MD-Bot/2.0' },
              body: JSON.stringify({ files: { 'toxic-db.json': { content: payload } } })
          });
          if (res.ok) console.log(`✅ [DB BACKUP] Backed up to Gist at ${new Date().toLocaleTimeString()}`);
      } catch (e) {
          console.error('❌ [DB BACKUP] Gist error:', e.message);
      }
  }

  async function restoreFromGist(db) {
      const { token, gistId } = getGistConfig();
      if (!token || !gistId) { console.log('ℹ️ [DB RESTORE] No GITHUB_TOKEN or GIST_ID — skipping Gist restore'); return false; }
      try {
          const res = await fetch(`https://api.github.com/gists/${gistId}`, {
              headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Toxic-MD-Bot/2.0' }
          });
          if (!res.ok) { console.error(`❌ [DB RESTORE] Gist fetch failed: ${res.status}`); return false; }
          const gist = await res.json();
          const fileContent = gist.files?.['toxic-db.json']?.content;
          if (!fileContent) { console.log('ℹ️ [DB RESTORE] No backup in Gist yet'); return false; }
          const data = JSON.parse(fileContent);
          restoreDbData(db, data);
          console.log(`🎉 [DB RESTORE] Restored from Gist (backed up: ${data.backed_up_at || 'unknown'})`);
          return true;
      } catch (e) {
          console.error('❌ [DB RESTORE] Gist restore error:', e.message);
          return false;
      }
  }

  async function backupDb(db) {
      if (hasUpstash()) {
          await backupToUpstash(db);
      } else {
          await backupToGist(db);
      }
  }

  async function restoreDb(db) {
      if (hasUpstash()) {
          return await restoreFromUpstash(db);
      }
      return await restoreFromGist(db);
  }

  function startBackupInterval(db) {
      const INTERVAL_MS = 5 * 60 * 1000;
      const source = hasUpstash() ? 'Upstash Redis' : 'GitHub Gist';
      setInterval(() => backupDb(db), INTERVAL_MS);
      console.log(`🔄 [DB BACKUP] Auto-backup every 5 minutes via ${source}`);

      const shutdown = async () => {
          console.log('🔄 [DB BACKUP] Saving before shutdown...');
          await backupDb(db);
          process.exit(0);
      };

      process.on('SIGTERM', shutdown);
      process.on('SIGINT', shutdown);
  }

  module.exports = { backupToGist, restoreFromGist, backupToUpstash, restoreFromUpstash, backupDb, restoreDb, startBackupInterval };
  