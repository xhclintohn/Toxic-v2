const { Pool } = require('pg');
const { database } = require('../config/settings');

const pool = new Pool({
    connectionString: database,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database pool error:', err.message);
});

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
                antipromote BOOLEAN DEFAULT false
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
            autolike: 'false',
            autoread: 'false',
            autobio: 'false',
            anticall: 'false',
            chatbotpm: 'false',
            autolikeemoji: '❤️',
            antilink: 'off',
            antidelete: 'false',
            antiedit: 'false',
            antistatusmention: 'delete',
            startmessage: 'true'
        };

        for (const [key, value] of Object.entries(defaultSettings)) {
            await client.query(`
                INSERT INTO settings (key, value) 
                VALUES ($1, $2)
                ON CONFLICT (key) DO NOTHING;
            `, [key, value]);
        }
    } catch (error) {
        console.error(`❌ Database setup failed: ${error}`);
    } finally {
        client.release();
    }
}

async function getSettings() {
    if (isCacheValid(cache.settings)) {
        return cache.settings.data;
    }
    try {
        const res = await pool.query("SELECT key, value FROM settings");
        const settings = {};
        res.rows.forEach(row => {
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
    try {
        const valueToStore = typeof value === 'boolean' ? (value ? 'true' : 'false') : value;
        await pool.query(`
            INSERT INTO settings (key, value) 
            VALUES ($1, $2)
            ON CONFLICT (key) DO UPDATE 
            SET value = EXCLUDED.value;
        `, [key, valueToStore]);
        cache.settings.data = null;
        cache.settings.time = 0;
    } catch (error) {
        console.error(`❌ Error updating global setting: ${key}: ${error}`);
    }
}

async function getGroupSettings(jid) {
    const cached = cache.groupSettings.get(jid);
    if (cached && (Date.now() - cached.time) < GROUP_SETTINGS_TTL) {
        return cached.data;
    }
    try {
        const globalSettings = await getSettings();
        const res = await pool.query('SELECT * FROM group_settings WHERE jid = $1', [jid]);
        let result;
        if (res.rows.length > 0) {
            result = {
                antidelete: res.rows[0].antidelete,
                gcpresence: res.rows[0].gcpresence,
                events: res.rows[0].events,
                antidemote: res.rows[0].antidemote,
                antipromote: res.rows[0].antipromote
            };
        } else {
            result = {
                antidelete: globalSettings.antidelete || true,
                gcpresence: false,
                events: false,
                antidemote: false,
                antipromote: false
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
        return {
            antidelete: true,
            gcpresence: false,
            events: false,
            antidemote: false,
            antipromote: false
        };
    }
}

async function updateGroupSetting(jid, key, value) {
    try {
        await pool.query(`
            INSERT INTO group_settings (jid, ${key})
            VALUES ($1, $2)
            ON CONFLICT (jid) DO UPDATE 
            SET ${key} = EXCLUDED.${key};
        `, [jid, value]);
        cache.groupSettings.delete(jid);
    } catch (error) {
        console.error(`❌ Error updating group setting ${key} for ${jid}: ${error}`);
    }
}

async function banUser(num) {
    try {
        await pool.query(`INSERT INTO banned_users (num) VALUES ($1) ON CONFLICT (num) DO NOTHING;`, [num]);
        cache.bannedUsers.data = null;
        cache.bannedUsers.time = 0;
    } catch (error) {
        console.error(`❌ Error banning user ${num}: ${error}`);
    }
}

async function unbanUser(num) {
    try {
        await pool.query(`DELETE FROM banned_users WHERE num = $1;`, [num]);
        cache.bannedUsers.data = null;
        cache.bannedUsers.time = 0;
    } catch (error) {
        console.error(`❌ Error unbanning user ${num}: ${error}`);
    }
}

async function addSudoUser(num) {
    try {
        await pool.query(`INSERT INTO sudo_users (num) VALUES ($1) ON CONFLICT (num) DO NOTHING;`, [num]);
        cache.sudoUsers.data = null;
        cache.sudoUsers.time = 0;
    } catch (error) {
        console.error(`❌ Error adding sudo user ${num}: ${error}`);
    }
}

async function removeSudoUser(num) {
    try {
        await pool.query(`DELETE FROM sudo_users WHERE num = $1;`, [num]);
        cache.sudoUsers.data = null;
        cache.sudoUsers.time = 0;
    } catch (error) {
        console.error(`❌ Error removing sudo user ${num}: ${error}`);
    }
}

async function getSudoUsers() {
    if (isCacheValid(cache.sudoUsers)) {
        return cache.sudoUsers.data;
    }
    try {
        const res = await pool.query('SELECT num FROM sudo_users');
        const users = res.rows.map(row => row.num);
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
    try {
        await pool.query(
            'INSERT INTO conversation_history (num, role, message) VALUES ($1, $2, $3)',
            [num, role, message]
        );
    } catch (error) {
        console.error(`❌ Error saving conversation for ${num}: ${error}`);
    }
}

async function getRecentMessages(num) {
    try {
        const res = await pool.query(
            'SELECT role, message FROM conversation_history WHERE num = $1 ORDER BY timestamp ASC',
            [num]
        );
        return res.rows;
    } catch (error) {
        console.error(`❌ Error retrieving conversation history for ${num}: ${error}`);
        return [];
    }
}

async function deleteUserHistory(num) {
    try {
        await pool.query('DELETE FROM conversation_history WHERE num = $1', [num]);
    } catch (error) {
        console.error(`❌ Error deleting conversation history for ${num}: ${error}`);
    }
}

async function getBannedUsers() {
    if (isCacheValid(cache.bannedUsers)) {
        return cache.bannedUsers.data;
    }
    try {
        const res = await pool.query('SELECT num FROM banned_users');
        const users = res.rows.map(row => row.num);
        cache.bannedUsers.data = users;
        cache.bannedUsers.time = Date.now();
        return users;
    } catch (error) {
        console.error(`❌ Error fetching banned users: ${error}`);
        if (cache.bannedUsers.data) return cache.bannedUsers.data;
        return [];
    }
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
    updateGroupSetting
};
