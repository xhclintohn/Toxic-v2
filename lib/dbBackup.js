const fs = require('fs');
  const path = require('path');
  const LOCAL_BACKUP = path.join(__dirname, '..', 'data', 'persistent.json');
  let pgPool = null;
  let pgReady = false;

  async function tryInitPg() {
      if (!process.env.DATABASE_URL) return false;
      try {
          const { Pool } = require('pg');
          const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
          await Promise.race([
              pool.query('SELECT 1'),
              new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000))
          ]);
          await pool.query(`CREATE TABLE IF NOT EXISTS toxic_backup (id TEXT PRIMARY KEY, data TEXT, updated_at BIGINT)`);
          pgPool = pool;
          pgReady = true;
          console.log('✅ [DB] Heroku PostgreSQL connected');
          return true;
      } catch (e) {
          console.log(`ℹ️ [DB] PostgreSQL not available (${e.message}) — using local backup`);
          return false;
      }
  }

  function collectData(db) {
      try {
          const settings = {};
          for (const row of db.prepare('SELECT key, value FROM settings').all()) settings[row.key] = row.value;
          const banned = db.prepare('SELECT num FROM banned_users').all().map(r => r.num);
          const sudo = db.prepare('SELECT num FROM sudo_users').all().map(r => r.num);
          const warns = db.prepare('SELECT jid, user, warns FROM warn_data').all();
          const groups = db.prepare('SELECT * FROM group_settings').all();
          return { settings, banned, sudo, warns, groups, ts: Date.now() };
      } catch { return null; }
  }

  function applyData(db, data) {
      if (!data) return;
      try {
          if (data.settings && typeof data.settings === 'object') {
              const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
              db.transaction(e => { for (const [k, v] of e) upsert.run(k, String(v)); })(Object.entries(data.settings));
          }
          if (Array.isArray(data.banned) && data.banned.length) {
              const ins = db.prepare('INSERT OR IGNORE INTO banned_users (num) VALUES (?)');
              db.transaction(a => { for (const n of a) ins.run(n); })(data.banned);
          }
          if (Array.isArray(data.sudo) && data.sudo.length) {
              const ins = db.prepare('INSERT OR IGNORE INTO sudo_users (num) VALUES (?)');
              db.transaction(a => { for (const n of a) ins.run(n); })(data.sudo);
          }
          if (Array.isArray(data.warns) && data.warns.length) {
              const ins = db.prepare('INSERT OR REPLACE INTO warn_data (jid, user, warns) VALUES (?, ?, ?)');
              db.transaction(a => { for (const w of a) ins.run(w.jid, w.user, w.warns); })(data.warns);
          }
          if (Array.isArray(data.groups) && data.groups.length) {
              const cols = ['jid','antidelete','gcpresence','events','antidemote','antipromote','antilink','antistatusmention','antitag','welcome','goodbye','warn_limit'];
              const ins = db.prepare(`INSERT OR REPLACE INTO group_settings (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`);
              db.transaction(a => { for (const g of a) ins.run(cols.map(c => g[c] ?? null)); })(data.groups);
          }
          console.log('✅ [DB] Restored: ' + Object.keys(data.settings || {}).length + ' settings, ' + (data.banned||[]).length + ' bans, ' + (data.groups||[]).length + ' groups');
      } catch (e) { console.error('❌ [DB] Restore error:', e.message); }
  }

  async function saveToPg(db) {
      if (!pgReady || !pgPool) return false;
      try {
          const data = collectData(db);
          if (!data) return false;
          await pgPool.query(
              'INSERT INTO toxic_backup (id, data, updated_at) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = $3',
              ['main', JSON.stringify(data), Date.now()]
          );
          return true;
      } catch (e) { console.error('❌ [DB] PG save error:', e.message); return false; }
  }

  async function restoreFromPg(db) {
      if (!pgReady || !pgPool) return false;
      try {
          const res = await pgPool.query('SELECT data FROM toxic_backup WHERE id = $1', ['main']);
          if (!res.rows.length || !res.rows[0].data) return false;
          const data = JSON.parse(res.rows[0].data);
          applyData(db, data);
          console.log(`🎉 [DB] Restored from PostgreSQL (saved ${new Date(data.ts).toLocaleString()})`);
          return true;
      } catch (e) { console.error('❌ [DB] PG restore error:', e.message); return false; }
  }

  function saveLocal(db) {
      try {
          const dir = path.dirname(LOCAL_BACKUP);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          const data = collectData(db);
          if (data) fs.writeFileSync(LOCAL_BACKUP, JSON.stringify(data));
      } catch {}
  }

  function restoreLocal(db) {
      try {
          if (!fs.existsSync(LOCAL_BACKUP)) return false;
          const data = JSON.parse(fs.readFileSync(LOCAL_BACKUP, 'utf8'));
          if (!data || !data.ts) return false;
          applyData(db, data);
          console.log(`🎉 [DB] Restored from local backup (saved ${new Date(data.ts).toLocaleString()})`);
          return true;
      } catch { return false; }
  }

  async function restoreFromGist(db) {
      const pgOk = await tryInitPg();
      if (pgOk) {
          const ok = await restoreFromPg(db);
          if (ok) return true;
      }
      return restoreLocal(db);
  }

  async function backupNow(db) {
      if (pgReady) {
          await saveToPg(db);
      } else {
          saveLocal(db);
      }
  }

  function startBackupInterval(db) {
      const source = pgReady ? 'PostgreSQL' : 'local JSON';
      setInterval(() => backupNow(db), 5 * 60 * 1000);
      console.log(`🔄 [DB] Auto-backup every 5min via ${source}`);
      const shutdown = async () => {
          console.log('🔄 [DB] Saving before shutdown...');
          await backupNow(db);
          process.exit(0);
      };
      process.on('SIGTERM', shutdown);
      process.on('SIGINT', shutdown);
  }

  module.exports = { restoreFromGist, startBackupInterval };
  