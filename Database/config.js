const { Pool } = require('pg');
const { database } = require('../Env/settings');

// Centralized logging function
const DEBUG = process.env.DEBUG === 'true';
const log = (message, level = 'info') => {
    if (level === 'info' && !DEBUG) return;
    console[level](message);
};

log(`🔄 Initializing database connection...`);

const pool = new Pool({
    connectionString: database,
    ssl: { rejectUnauthorized: false }
});

async function initializeDatabase() {
    const client = await pool.connect();
    log(`🔄 Checking and creating settings tables...`);
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS settings (
                id SERIAL PRIMARY KEY,
                key TEXT UNIQUE NOT NULL,
                value TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS group_settings (
                jid TEXT NOT NULL,
                key TEXT NOT NULL,
                value TEXT NOT NULL,
                PRIMARY KEY (jid, key)
            );
            CREATE TABLE IF NOT EXISTS conversation_history (
                id SERIAL PRIMARY KEY,
                num TEXT NOT NULL,
                role TEXT NOT NULL,
                message TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS sudo_users (
                num TEXT PRIMARY KEY
            );
            CREATE TABLE IF NOT EXISTS banned_users (
                num TEXT PRIMARY KEY
            );
            CREATE TABLE IF NOT EXISTS users (
                num TEXT PRIMARY KEY
            );
        `);

        const defaultSettings = {
            prefix: '.',
            packname: 'Toxic-MD',
            mode: 'public',
            presence: 'online',
            autoview: 'true',
            autolike: 'true',
            autoread: 'false',
            autobio: 'false',
            anticall: 'false',
            reactEmoji: '❤️'
        };

        const settingsCount = Object.keys(defaultSettings).length;
        for (const [key, value] of Object.entries(defaultSettings)) {
            await client.query(`
                INSERT INTO settings (key, value) 
                VALUES ($1, $2)
                ON CONFLICT (key) DO NOTHING;
            `, [key, value]);
        }
        log(`✅ Initialized ${settingsCount} default settings`);

        log(`✅ Database tables initialized successfully`);
    } catch (error) {
        log(`❌ Database setup failed: ${error}`, 'error');
    } finally {
        client.release();
    }
}

const defaultGroupSettings = {
    antitag: 'false',
    antidelete: 'true',
    gcpresence: 'false',
    antiforeign: 'false',
    antidemote: 'false',
    antipromote: 'false',
    events: 'false',
    antilink: 'false'
};

async function initializeGroupSettings(jid) {
    try {
        const settingsCount = Object.keys(defaultGroupSettings).length;
        for (const [key, value] of Object.entries(defaultGroupSettings)) {
            await pool.query(`
                INSERT INTO group_settings (jid, key, value)
                VALUES ($1, $2, $3)
                ON CONFLICT (jid, key) DO NOTHING;
            `, [jid, key, value]);
        }
        log(`✅ Initialized ${settingsCount} group settings for ${jid}`);
    } catch (error) {
        log(`❌ Error initializing group settings for ${jid}: ${error}`, 'error');
    }
}

async function getGroupSetting(jid) {
    try {
        const res = await pool.query(`
            SELECT key, value FROM group_settings WHERE jid = $1;
        `, [jid]);

        if (res.rows.length === 0) {
            log(`🔍 No settings found for ${jid}, initializing defaults`);
            await initializeGroupSettings(jid);
            return defaultGroupSettings;
        }

        let settings = {};
        res.rows.forEach(row => {
            settings[row.key] = row.value === 'true' ? true : row.value === 'false' ? false : row.value;
        });
        log(`🔍 Fetched group settings for ${jid}: ${JSON.stringify(settings)}`);
        return settings;
    } catch (error) {
        log(`❌ Error fetching group settings for ${jid}: ${error}`, 'error');
        return {};
    }
}

async function updateGroupSetting(jid, key, value) {
    try {
        const valueToStore = typeof value === 'boolean' ? (value ? 'true' : 'false') : value;
        await pool.query(`
            INSERT INTO group_settings (jid, key, value)
            VALUES ($1, $2, $3)
            ON CONFLICT (jid, key) DO UPDATE
            SET value = EXCLUDED.value;
        `, [jid, key, valueToStore]);
        log(`✅ Updated group setting for ${jid}: ${key}=${value}`);
    } catch (error) {
        log(`❌ Error updating group setting for ${jid}: ${key}: ${error}`, 'error');
    }
}

async function getAllGroupSettings() {
    try {
        const res = await pool.query(`
            SELECT * FROM group_settings;
        `);
        log(`✅ Fetched ${res.rows.length} group settings`);
        return res.rows;
    } catch (error) {
        log(`❌ Error fetching all group settings: ${error}`, 'error');
        return [];
    }
}

async function getSettings() {
    try {
        const res = await pool.query("SELECT key, value FROM settings");
        const settings = {};
        res.rows.forEach(row => {
            settings[row.key] = row.value === 'true' ? true : row.value === 'false' ? false : row.value;
        });
        log(`✅ Fetched global settings: ${JSON.stringify(settings)}`);
        return settings;
    } catch (error) {
        log(`❌ Error fetching global settings: ${error}`, 'error');
        return {};
    }
}

async function updateSetting(key, value) {
    try {
        await pool.query(`
            INSERT INTO settings (key, value) 
            VALUES ($1, $2)
            ON CONFLICT (key) DO UPDATE 
            SET value = EXCLUDED.value;
        `, [key, value]);
        log(`✅ Updated global setting: ${key}=${value}`);
    } catch (error) {
        log(`❌ Error updating global setting: ${key}: ${error}`, 'error');
    }
}

async function banUser(num) {
    try {
        await pool.query(`INSERT INTO banned_users (num) VALUES ($1) ON CONFLICT (num) DO NOTHING;`, [num]);
        log(`✅ Banned user ${num}`);
    } catch (error) {
        log(`❌ Error banning user ${num}: ${error}`, 'error');
    }
}

async function unbanUser(num) {
    try {
        await pool.query(`DELETE FROM banned_users WHERE num = $1;`, [num]);
        log(`✅ Unbanned user ${num}`);
    } catch (error) {
        log(`❌ Error unbanning user ${num}: ${error}`, 'error');
    }
}

async function addSudoUser(num) {
    try {
        await pool.query(`INSERT INTO sudo_users (num) VALUES ($1) ON CONFLICT (num) DO NOTHING;`, [num]);
        log(`✅ Added sudo user ${num}`);
    } catch (error) {
        log(`❌ Error adding sudo user ${num}: ${error}`, 'error');
    }
}

async function removeSudoUser(num) {
    try {
        await pool.query(`DELETE FROM sudo_users WHERE num = $1;`, [num]);
        log(`✅ Removed sudo user ${num}`);
    } catch (error) {
        log(`❌ Error removing sudo user ${num}: ${error}`, 'error');
    }
}

async function getSudoUsers() {
    try {
        const res = await pool.query('SELECT num FROM sudo_users');
        log(`✅ Fetched ${res.rows.length} sudo users`);
        return res.rows.map(row => row.num);
    } catch (error) {
        log(`❌ Error fetching sudo users: ${error}`, 'error');
        return [];
    }
}

async function saveConversation(num, role, message) {
    try {
        await pool.query(
            'INSERT INTO conversation_history (num, role, message) VALUES ($1, $2, $3)',
            [num, role, message]
        );
        log(`✅ Saved conversation for ${num}`);
    } catch (error) {
        log(`❌ Error saving conversation for ${num}: ${error}`, 'error');
    }
}

async function getRecentMessages(num) {
    try {
        const res = await pool.query(
            'SELECT role, message FROM conversation_history WHERE num = $1 ORDER BY timestamp ASC',
            [num]
        );
        log(`✅ Fetched ${res.rows.length} recent messages for ${num}`);
        return res.rows;
    } catch (error) {
        log(`❌ Error retrieving conversation history for ${num}: ${error}`, 'error');
        return [];
    }
}

async function deleteUserHistory(num) {
    try {
        await pool.query('DELETE FROM conversation_history WHERE num = $1', [num]);
        log(`✅ Deleted conversation history for ${num}`);
    } catch (error) {
        log(`❌ Error deleting conversation history for ${num}: ${error}`, 'error');
    }
}

async function getBannedUsers() {
    try {
        const res = await pool.query('SELECT num FROM banned_users');
        log(`✅ Fetched ${res.rows.length} banned users`);
        return res.rows.map(row => row.num);
    } catch (error) {
        log(`❌ Error fetching banned users: ${error}`, 'error');
        return [];
    }
}

initializeDatabase().catch(err => log(`❌ Database initialization failed: ${err}`, 'error'));

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
    getGroupSetting,
    updateGroupSetting,
    initializeGroupSettings
};