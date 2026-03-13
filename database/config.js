const { database } = require('../config/settings');

let pool = null;
let db = null;
let usePostgres = false;
let dbReady = false;
let dbReadyResolve;
const dbReadyPromise = new Promise(resolve => { dbReadyResolve = resolve; });

async function waitForDb() {
    if (dbReady) return;
    await dbReadyPromise;
}

const POSTGRES_TIMEOUT_MS = 15000;

async function tryInitPostgres() {
    return new Promise(async (resolve) => {
        const timer = setTimeout(() => {
            console.log('⚠️ PostgreSQL connection timed out, switching to SQLite...');
            resolve(false);
        }, POSTGRES_TIMEOUT_MS);

        try {
            const { Pool } = require('pg');
            const testPool = new Pool({
                connectionString: database,
                ssl: { rejectUnauthorized: false },
                max: 10,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: POSTGRES_TIMEOUT_MS
            });
            testPool.on('error', () => {});
            const client = await testPool.connect();
            client.release();
            clearTimeout(timer);
            pool = testPool;
            console.log('✅ PostgreSQL connected successfully');
            resolve(true);
        } catch (err) {
            clearTimeout(timer);
            console.log(`⚠️ PostgreSQL unavailable (${err.message}), switching to SQLite...`);
            resolve(false);
        }
    });
}

function initSQLite() {
    const Database = require('better-sqlite3');
    db = new Database('./whatsasena.db');
    db.pragma('journal_mode = WAL');
    console.log('✅ SQLite database initialized');
}

const cache = {
    settings: { data: null, time: 0, ttl: 30000 },
    sudoUsers: { data: null, time: 0, ttl: 60000 },
    bannedUsers: { data: null, time: 0, ttl: 60000 },
    groupSettings: new Map()
};

const GROUP_SETTINGS_TTL = 60000;

function isCacheValid(entry) {
    return entry.data !== null && (Date.now() - entry.time) < entry.ttl;
}

async function initializeDatabase() {
    if (database) {
        usePostgres = await tryInitPostgres();
    }

    if (!usePostgres) {
        try {
            initSQLite();
        } catch (err) {
            console.error('❌ SQLite initialization failed:', err.message);
            throw err;
        }
    }

    try {
        if (usePostgres) {
            const client = await pool.connect();
            try {
                await client.query(`
                    CREATE TABLE IF NOT EXISTS settings (
                        id SERIAL PRIMARY KEY,
                        key TEXT UNIQUE NOT NULL,
                        value TEXT NOT NULL
                    );
                    CREATE TABLE IF NOT EXISTS group_settings (
                        jid TEXT PRIMARY KEY,
                        antidelete BOOLEAN DEFAULT true,
                        gcpresence BOOLEAN DEFAULT false,
                        events BOOLEAN DEFAULT false,
                        antidemote BOOLEAN DEFAULT false,
                        antipromote BOOLEAN DEFAULT false,
                        antilink TEXT DEFAULT 'off',
                        antistatusmention TEXT DEFAULT 'off',
                        antitag BOOLEAN DEFAULT false,
                        welcome BOOLEAN DEFAULT false,
                        goodbye BOOLEAN DEFAULT false
                    );
                    CREATE TABLE IF NOT EXISTS conversation_history (
                        id SERIAL PRIMARY KEY,
                        num TEXT NOT NULL,
                        role TEXT NOT NULL,
                        message TEXT NOT NULL,
                        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                    CREATE TABLE IF NOT EXISTS sudo_users (num TEXT PRIMARY KEY);
                    CREATE TABLE IF NOT EXISTS banned_users (num TEXT PRIMARY KEY);
                    CREATE TABLE IF NOT EXISTS users (num TEXT PRIMARY KEY);
                    CREATE TABLE IF NOT EXISTS warns (
                        jid TEXT NOT NULL,
                        participant TEXT NOT NULL,
                        count INTEGER DEFAULT 0,
                        PRIMARY KEY (jid, participant)
                    );
                `);

                for (const [col, def] of [['antilink', "TEXT DEFAULT 'off'"], ['antistatusmention', "TEXT DEFAULT 'off'"], ['antitag', 'BOOLEAN DEFAULT false'], ['welcome', 'BOOLEAN DEFAULT false'], ['goodbye', 'BOOLEAN DEFAULT false']]) {
                    try { await client.query(`ALTER TABLE group_settings ADD COLUMN IF NOT EXISTS ${col} ${def}`); } catch (e) {}
                }

                const defaultSettings = {
                    prefix: '.', packname: 'Toxic-MD', mode: 'public', presence: 'online',
                    autoview: 'true', autolike: 'false', autoread: 'false', autobio: 'false',
                    anticall: 'false', chatbotpm: 'false', autolikeemoji: '❤️',
                    antidelete: 'false', antiedit: 'false', startmessage: 'true',
                stealth: 'false', multiprefix: 'false',
                    stealth: 'false', multiprefix: 'false'
                };

                for (const [key, value] of Object.entries(defaultSettings)) {
                    await client.query(
                        `INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING;`,
                        [key, value]
                    );
                }
            } finally {
                client.release();
            }
        } else {
            db.exec(`
                CREATE TABLE IF NOT EXISTS settings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    key TEXT UNIQUE NOT NULL,
                    value TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS group_settings (
                    jid TEXT PRIMARY KEY,
                    antidelete INTEGER DEFAULT 1,
                    gcpresence INTEGER DEFAULT 0,
                    events INTEGER DEFAULT 0,
                    antidemote INTEGER DEFAULT 0,
                    antipromote INTEGER DEFAULT 0,
                    antilink TEXT DEFAULT 'off',
                    antistatusmention TEXT DEFAULT 'off',
                    antitag INTEGER DEFAULT 0,
                    welcome INTEGER DEFAULT 0,
                    goodbye INTEGER DEFAULT 0
                );
                CREATE TABLE IF NOT EXISTS conversation_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    num TEXT NOT NULL,
                    role TEXT NOT NULL,
                    message TEXT NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS sudo_users (num TEXT PRIMARY KEY);
                CREATE TABLE IF NOT EXISTS banned_users (num TEXT PRIMARY KEY);
                CREATE TABLE IF NOT EXISTS users (num TEXT PRIMARY KEY);
                CREATE TABLE IF NOT EXISTS warns (
                    jid TEXT NOT NULL,
                    participant TEXT NOT NULL,
                    count INTEGER DEFAULT 0,
                    PRIMARY KEY (jid, participant)
                );
            `);

            for (const [col, def] of [["antilink", "TEXT DEFAULT 'off'"], ["antistatusmention", "TEXT DEFAULT 'off'"], ["antitag", "INTEGER DEFAULT 0"], ["welcome", "INTEGER DEFAULT 0"], ["goodbye", "INTEGER DEFAULT 0"]]) {
                try { db.exec(`ALTER TABLE group_settings ADD COLUMN ${col} ${def}`); } catch (e) {}
            }

            const defaultSettings = {
                prefix: '.', packname: 'Toxic-MD', mode: 'public', presence: 'online',
                autoview: 'true', autolike: 'false', autoread: 'false', autobio: 'false',
                anticall: 'false', chatbotpm: 'false', autolikeemoji: '❤️',
                antidelete: 'false', antiedit: 'false', startmessage: 'true',
                stealth: 'false', multiprefix: 'false'
            };

            const insert = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
            for (const [key, value] of Object.entries(defaultSettings)) insert.run(key, value);
        }
    } catch (error) {
        console.error(`❌ Database setup failed: ${error}`);
    } finally {
        dbReady = true;
        dbReadyResolve();
    }
}

async function getSettings() {
    await waitForDb();
    if (isCacheValid(cache.settings)) return cache.settings.data;
    try {
        let rows;
        if (usePostgres) {
            const res = await pool.query('SELECT key, value FROM settings');
            rows = res.rows;
        } else {
            rows = db.prepare('SELECT key, value FROM settings').all();
        }
        const settings = {};
        rows.forEach(row => {
            if (row.value === 'true') settings[row.key] = true;
            else if (row.value === 'false') settings[row.key] = false;
            else settings[row.key] = row.value;
        });
        cache.settings.data = settings;
        cache.settings.time = Date.now();
        return settings;
    } catch (error) {
        console.error(`❌ Error fetching global settings: ${error}`);
        if (cache.settings.data) return cache.settings.data;
        return {};
    }
}

async function updateSetting(key, value) {
    await waitForDb();
    try {
        const valueToStore = typeof value === 'boolean' ? (value ? 'true' : 'false') : value;
        if (usePostgres) {
            await pool.query(
                `INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;`,
                [key, valueToStore]
            );
        } else {
            db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, valueToStore);
        }
        cache.settings.data = null;
        cache.settings.time = 0;
    } catch (error) {
        console.error(`❌ Error updating global setting ${key}: ${error}`);
    }
}

async function getGroupSettings(jid) {
    await waitForDb();
    const cached = cache.groupSettings.get(jid);
    if (cached && (Date.now() - cached.time) < GROUP_SETTINGS_TTL) return cached.data;
    try {
        let rows;
        if (usePostgres) {
            const res = await pool.query('SELECT * FROM group_settings WHERE jid = $1', [jid]);
            rows = res.rows;
        } else {
            rows = db.prepare('SELECT * FROM group_settings WHERE jid = ?').all(jid);
        }

        let result;
        if (rows.length > 0) {
            const r = rows[0];
            result = {
                antidelete: r.antidelete === true || r.antidelete === 1,
                gcpresence: r.gcpresence === true || r.gcpresence === 1,
                events: r.events === true || r.events === 1,
                antidemote: r.antidemote === true || r.antidemote === 1,
                antipromote: r.antipromote === true || r.antipromote === 1,
                antitag: r.antitag === true || r.antitag === 1,
                antilink: r.antilink || 'off',
                antistatusmention: r.antistatusmention || 'off',
                welcome: r.welcome === true || r.welcome === 1,
                goodbye: r.goodbye === true || r.goodbye === 1
            };
        } else {
            result = {
                antidelete: true,
                gcpresence: false,
                events: false,
                antidemote: false,
                antipromote: false,
                antitag: false,
                antilink: 'off',
                antistatusmention: 'off',
                welcome: false,
                goodbye: false
            };
        }
        cache.groupSettings.set(jid, { data: result, time: Date.now() });
        if (cache.groupSettings.size > 500) {
            const oldestKey = cache.groupSettings.keys().next().value;
            cache.groupSettings.delete(oldestKey);
        }
        return result;
    } catch (error) {
        console.error(`❌ Error fetching group settings for ${jid}: ${error}`);
        return { antidelete: true, gcpresence: false, events: false, antidemote: false, antipromote: false, antitag: false, antilink: 'off', antistatusmention: 'off', welcome: false, goodbye: false };
    }
}

async function updateGroupSetting(jid, key, value) {
    await waitForDb();
    try {
        if (usePostgres) {
            await pool.query(
                `INSERT INTO group_settings (jid, ${key}) VALUES ($1, $2) ON CONFLICT (jid) DO UPDATE SET ${key} = EXCLUDED.${key};`,
                [jid, value]
            );
        } else {
            const existing = db.prepare('SELECT jid FROM group_settings WHERE jid = ?').get(jid);
            if (existing) {
                db.prepare(`UPDATE group_settings SET ${key} = ? WHERE jid = ?`).run(value, jid);
            } else {
                db.prepare(`INSERT INTO group_settings (jid, ${key}) VALUES (?, ?)`).run(jid, value);
            }
        }
        cache.groupSettings.delete(jid);
    } catch (error) {
        console.error(`❌ Error updating group setting ${key} for ${jid}: ${error}`);
    }
}

async function banUser(num) {
    await waitForDb();
    try {
        if (usePostgres) {
            await pool.query(`INSERT INTO banned_users (num) VALUES ($1) ON CONFLICT (num) DO NOTHING;`, [num]);
        } else {
            db.prepare('INSERT OR IGNORE INTO banned_users (num) VALUES (?)').run(num);
        }
        cache.bannedUsers.data = null;
        cache.bannedUsers.time = 0;
    } catch (error) {
        console.error(`❌ Error banning user ${num}: ${error}`);
    }
}

async function unbanUser(num) {
    await waitForDb();
    try {
        if (usePostgres) {
            await pool.query(`DELETE FROM banned_users WHERE num = $1;`, [num]);
        } else {
            db.prepare('DELETE FROM banned_users WHERE num = ?').run(num);
        }
        cache.bannedUsers.data = null;
        cache.bannedUsers.time = 0;
    } catch (error) {
        console.error(`❌ Error unbanning user ${num}: ${error}`);
    }
}

async function addSudoUser(num) {
    await waitForDb();
    try {
        if (usePostgres) {
            await pool.query(`INSERT INTO sudo_users (num) VALUES ($1) ON CONFLICT (num) DO NOTHING;`, [num]);
        } else {
            db.prepare('INSERT OR IGNORE INTO sudo_users (num) VALUES (?)').run(num);
        }
        cache.sudoUsers.data = null;
        cache.sudoUsers.time = 0;
    } catch (error) {
        console.error(`❌ Error adding sudo user ${num}: ${error}`);
    }
}

async function removeSudoUser(num) {
    await waitForDb();
    try {
        if (usePostgres) {
            await pool.query(`DELETE FROM sudo_users WHERE num = $1;`, [num]);
        } else {
            db.prepare('DELETE FROM sudo_users WHERE num = ?').run(num);
        }
        cache.sudoUsers.data = null;
        cache.sudoUsers.time = 0;
    } catch (error) {
        console.error(`❌ Error removing sudo user ${num}: ${error}`);
    }
}

async function getSudoUsers() {
    await waitForDb();
    if (isCacheValid(cache.sudoUsers)) return cache.sudoUsers.data;
    try {
        let rows;
        if (usePostgres) {
            const res = await pool.query('SELECT num FROM sudo_users');
            rows = res.rows;
        } else {
            rows = db.prepare('SELECT num FROM sudo_users').all();
        }
        const users = rows.map(row => row.num);
        cache.sudoUsers.data = users;
        cache.sudoUsers.time = Date.now();
        return users;
    } catch (error) {
        console.error(`❌ Error fetching sudo users: ${error}`);
        if (cache.sudoUsers.data) return cache.sudoUsers.data;
        return [];
    }
}

async function saveConversation(num, role, message) {
    await waitForDb();
    try {
        if (usePostgres) {
            await pool.query('INSERT INTO conversation_history (num, role, message) VALUES ($1, $2, $3)', [num, role, message]);
        } else {
            db.prepare('INSERT INTO conversation_history (num, role, message) VALUES (?, ?, ?)').run(num, role, message);
        }
    } catch (error) {
        console.error(`❌ Error saving conversation for ${num}: ${error}`);
    }
}

async function getRecentMessages(num) {
    await waitForDb();
    try {
        let rows;
        if (usePostgres) {
            const res = await pool.query('SELECT role, message FROM conversation_history WHERE num = $1 ORDER BY timestamp ASC', [num]);
            rows = res.rows;
        } else {
            rows = db.prepare('SELECT role, message FROM conversation_history WHERE num = ? ORDER BY timestamp ASC').all(num);
        }
        return rows;
    } catch (error) {
        console.error(`❌ Error retrieving conversation history for ${num}: ${error}`);
        return [];
    }
}

async function deleteUserHistory(num) {
    await waitForDb();
    try {
        if (usePostgres) {
            await pool.query('DELETE FROM conversation_history WHERE num = $1', [num]);
        } else {
            db.prepare('DELETE FROM conversation_history WHERE num = ?').run(num);
        }
    } catch (error) {
        console.error(`❌ Error deleting conversation history for ${num}: ${error}`);
    }
}

async function getBannedUsers() {
    await waitForDb();
    if (isCacheValid(cache.bannedUsers)) return cache.bannedUsers.data;
    try {
        let rows;
        if (usePostgres) {
            const res = await pool.query('SELECT num FROM banned_users');
            rows = res.rows;
        } else {
            rows = db.prepare('SELECT num FROM banned_users').all();
        }
        const users = rows.map(row => row.num);
        cache.bannedUsers.data = users;
        cache.bannedUsers.time = Date.now();
        return users;
    } catch (error) {
        console.error(`❌ Error fetching banned users: ${error}`);
        if (cache.bannedUsers.data) return cache.bannedUsers.data;
        return [];
    }
}


async function getWarnCount(jid, participant) {
    await waitForDb();
    try {
        if (usePostgres) {
            const res = await pool.query('SELECT count FROM warns WHERE jid = $1 AND participant = $2', [jid, participant]);
            return res.rows.length > 0 ? res.rows[0].count : 0;
        } else {
            const row = db.prepare('SELECT count FROM warns WHERE jid = ? AND participant = ?').get(jid, participant);
            return row ? row.count : 0;
        }
    } catch (e) {
        return 0;
    }
}

async function incrementWarn(jid, participant) {
    await waitForDb();
    try {
        if (usePostgres) {
            const res = await pool.query(
                `INSERT INTO warns (jid, participant, count) VALUES ($1, $2, 1)
                 ON CONFLICT (jid, participant) DO UPDATE SET count = warns.count + 1
                 RETURNING count`,
                [jid, participant]
            );
            return res.rows[0].count;
        } else {
            const row = db.prepare('SELECT count FROM warns WHERE jid = ? AND participant = ?').get(jid, participant);
            if (row) {
                db.prepare('UPDATE warns SET count = count + 1 WHERE jid = ? AND participant = ?').run(jid, participant);
                return row.count + 1;
            } else {
                db.prepare('INSERT INTO warns (jid, participant, count) VALUES (?, ?, 1)').run(jid, participant);
                return 1;
            }
        }
    } catch (e) {
        return 0;
    }
}

async function resetWarn(jid, participant) {
    await waitForDb();
    try {
        if (usePostgres) {
            await pool.query('DELETE FROM warns WHERE jid = $1 AND participant = $2', [jid, participant]);
        } else {
            db.prepare('DELETE FROM warns WHERE jid = ? AND participant = ?').run(jid, participant);
        }
    } catch (e) {}
}

initializeDatabase().catch(err => console.error(`❌ Database initialization failed: ${err}`));

module.exports = {
    addSudoUser,
    saveConversation,
    getRecentMessages,
    deleteUserHistory,
    getSudoUsers,
    removeSudoUser,
    banUser,
    unbanUser,
    getBannedUsers,
    getSettings,
    updateSetting,
    getGroupSettings,
    updateGroupSetting,
    getWarnCount,
    incrementWarn,
    resetWarn
};
