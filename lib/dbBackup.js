const fetch = require('node-fetch');

function getGistConfig() {
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || (() => { try { return require('../keys').GITHUB_TOKEN; } catch { return ''; } })();
    const gistId = process.env.GIST_ID || (() => { try { return require('../keys').GIST_ID; } catch { return ''; } })();
    return { token, gistId };
}

async function backupToGist(db) {
    const { token, gistId } = getGistConfig();
    if (!token || !gistId) return;

    try {
        const settings = {};
        for (const row of db.prepare('SELECT key, value FROM settings').all()) {
            settings[row.key] = row.value;
        }

        const banned = db.prepare('SELECT num FROM banned_users').all().map(r => r.num);
        const sudo = db.prepare('SELECT num FROM sudo_users').all().map(r => r.num);
        const warns = db.prepare('SELECT jid, user, warns FROM warn_data').all();
        const groups = db.prepare('SELECT * FROM group_settings').all();

        const payload = JSON.stringify({ settings, banned, sudo, warns, groups, backed_up_at: new Date().toISOString() }, null, 2);

        const res = await fetch(`https://api.github.com/gists/${gistId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'Toxic-MD-Bot/2.0'
            },
            body: JSON.stringify({
                files: { 'toxic-db.json': { content: payload } }
            })
        });

        if (!res.ok) {
            const err = await res.text();
            console.error(`❌ [DB BACKUP] Gist update failed: ${res.status} ${err.slice(0, 100)}`);
        } else {
            console.log(`✅ [DB BACKUP] Database backed up to Gist at ${new Date().toLocaleTimeString()}`);
        }
    } catch (e) {
        console.error('❌ [DB BACKUP] Error:', e.message);
    }
}

async function restoreFromGist(db) {
    const { token, gistId } = getGistConfig();
    if (!token || !gistId) {
        console.log('ℹ️ [DB RESTORE] No GITHUB_TOKEN or GIST_ID set — skipping restore');
        return;
    }

    try {
        const res = await fetch(`https://api.github.com/gists/${gistId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Toxic-MD-Bot/2.0'
            }
        });

        if (!res.ok) {
            console.error(`❌ [DB RESTORE] Failed to fetch Gist: ${res.status}`);
            return;
        }

        const gist = await res.json();
        const fileContent = gist.files?.['toxic-db.json']?.content;
        if (!fileContent) {
            console.log('ℹ️ [DB RESTORE] No backup found in Gist yet');
            return;
        }

        const data = JSON.parse(fileContent);

        if (data.settings && typeof data.settings === 'object') {
            const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
            const upsertMany = db.transaction((entries) => {
                for (const [k, v] of entries) upsert.run(k, String(v));
            });
            upsertMany(Object.entries(data.settings));
            console.log(`✅ [DB RESTORE] Restored ${Object.keys(data.settings).length} settings`);
        }

        if (Array.isArray(data.banned) && data.banned.length) {
            const ins = db.prepare('INSERT OR IGNORE INTO banned_users (num) VALUES (?)');
            const insMany = db.transaction((items) => { for (const n of items) ins.run(n); });
            insMany(data.banned);
            console.log(`✅ [DB RESTORE] Restored ${data.banned.length} banned users`);
        }

        if (Array.isArray(data.sudo) && data.sudo.length) {
            const ins = db.prepare('INSERT OR IGNORE INTO sudo_users (num) VALUES (?)');
            const insMany = db.transaction((items) => { for (const n of items) ins.run(n); });
            insMany(data.sudo);
            console.log(`✅ [DB RESTORE] Restored ${data.sudo.length} sudo users`);
        }

        if (Array.isArray(data.warns) && data.warns.length) {
            const ins = db.prepare('INSERT OR REPLACE INTO warn_data (jid, user, warns) VALUES (?, ?, ?)');
            const insMany = db.transaction((items) => { for (const w of items) ins.run(w.jid, w.user, w.warns); });
            insMany(data.warns);
            console.log(`✅ [DB RESTORE] Restored ${data.warns.length} warn records`);
        }

        if (Array.isArray(data.groups) && data.groups.length) {
            const cols = ['jid', 'antidelete', 'gcpresence', 'events', 'antidemote', 'antipromote', 'antilink', 'antistatusmention', 'antitag', 'welcome', 'goodbye', 'warn_limit'];
            const ins = db.prepare(`INSERT OR REPLACE INTO group_settings (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`);
            const insMany = db.transaction((items) => { for (const g of items) ins.run(cols.map(c => g[c] ?? null)); });
            insMany(data.groups);
            console.log(`✅ [DB RESTORE] Restored ${data.groups.length} group configs`);
        }

        console.log(`🎉 [DB RESTORE] Database restored from Gist (backed up: ${data.backed_up_at || 'unknown'})`);
    } catch (e) {
        console.error('❌ [DB RESTORE] Error:', e.message);
    }
}

function startBackupInterval(db) {
    const INTERVAL_MS = 5 * 60 * 1000;
    setInterval(() => backupToGist(db), INTERVAL_MS);
    console.log('🔄 [DB BACKUP] Auto-backup every 5 minutes via GitHub Gist');

    process.on('SIGTERM', async () => {
        console.log('🔄 [DB BACKUP] Backing up before shutdown...');
        await backupToGist(db);
    });

    process.on('SIGINT', async () => {
        console.log('🔄 [DB BACKUP] Backing up before shutdown...');
        await backupToGist(db);
        process.exit(0);
    });
}

module.exports = { backupToGist, restoreFromGist, startBackupInterval };
