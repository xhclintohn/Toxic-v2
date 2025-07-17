const { Pool } = require('pg');
const { database } = require('../Env/settings');

const pool = new Pool({
    connectionString: database,
    ssl: { rejectUnauthorized: false }
});

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
            reactEmoji: '❤️',
            chatbotpm: 'true'
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
        for (const [key, value] of Object.entries(defaultGroupSettings)) {
            await pool.query(`
                INSERT INTO group_settings (jid, key, value)
                VALUES ($1, $2, $3)
                ON CONFLICT (jid, key) DO NOTHING;
            `, [jid, key, value]);
        }
    } catch (error) {
        console.error(`❌ Error initializing group settings for ${jid}: ${error}`);
    }
}

async function getGroupSetting(jid) {
    try {
        const res = await pool.query(`
            SELECT key, value FROM group_settings WHERE jid = $1;
        `, [jid]);

        if (res.rows.length === 0) {
            await initializeGroupSettings(jid);
            return defaultGroupSettings;
        }

        let settings = {};
        res.rows.forEach(row => {
            settings[row.key] = row.value === 'true' ? true : row.value === 'false' ? false : row.value;
        });
        return settings;
    } catch (error) {
        console.error(`❌ Error fetching group settings for ${jid}: ${error}`);
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
    } catch (error) {
        console.error(`❌ Error updating group setting for ${jid}: ${key}: ${error}`);
    }
}

async function getAllGroupSettings() {
    try {
        const res = await pool.query(`
            SELECT * FROM group_settings;
        `);
        return res.rows;
    } catch (error) {
        console.error(`❌ Error fetching all group settings: ${error}`);
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
        return settings;
    } catch (error) {
        console.error(`❌ Error fetching global settings: ${error}`);
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
    } catch (error) {
        console.error(`❌ Error updating global setting: ${key}: ${error}`);
    }
}

async function banUser(num) {
    try {
        await pool.query(`INSERT INTO banned_users (num) VALUES ($1) ON CONFLICT (num) DO NOTHING;`, [num]);
    } catch (error) {
        console.error(`❌ Error banning user ${num}: ${error}`);
    }
}

async function unbanUser(num) {
    try {
        await pool.query(`DELETE FROM banned_users WHERE num = $1;`, [num]);
    } catch (error) {
        console.error(`❌ Error unbanning user ${num}: ${error}`);
    }
}

async function addSudoUser(num) {
    try {
        await pool.query(`INSERT INTO sudo_users (num) VALUES ($1) ON CONFLICT (num) DO NOTHING;`, [num]);
    } catch (error) {
        console.error(`❌ Error adding sudo user ${num}: ${error}`);
    }
}

async function removeSudoUser(num) {
    try {
        await pool.query(`DELETE FROM sudo_users WHERE num = $1;`, [num]);
    } catch (error) {
        console.error(`❌ Error removing sudo user ${num}: ${error}`);
    }
}

async function getSudoUsers() {
    try {
        const res = await pool.query('SELECT num FROM sudo_users');
        return res.rows.map(row => row.num);
    } catch (error) {
        console.error(`❌ Error fetching sudo users: ${error}`);
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
    try {
        const res = await pool.query('SELECT num FROM banned_users');
        return res.rows.map(row => row.num);
    } catch (error) {
        console.error(`❌ Error fetching banned users: ${error}`);
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
    getGroupSetting,
    updateGroupSetting,
    initializeGroupSettings
};
