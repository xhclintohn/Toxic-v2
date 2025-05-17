const { Pool } = require('pg');
const { database } = require('../Env/settings');

console.log(`🔄 Initializing database connection...`);

const pool = new Pool({
    connectionString: database,
    ssl: { rejectUnauthorized: false }
});

async function initializeDatabase() {
    const client = await pool.connect();
    console.log(`🔄 Checking and creating settings tables...`);
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS settings (
                id SERIAL PRIMARY KEY,
                key TEXT UNIQUE NOT NULL,
                value TEXT NOT NULL
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS group_settings (
                jid TEXT NOT NULL,
                key TEXT NOT NULL,
                value TEXT NOT NULL,
                PRIMARY KEY (jid, key)
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS conversation_history (
                id SERIAL PRIMARY KEY,
                num TEXT NOT NULL,
                role TEXT NOT NULL, -- 'user' or 'bot'
                message TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS sudo_users (
                num TEXT PRIMARY KEY
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS banned_users (
                num TEXT PRIMARY KEY
            );
        `);

        await client.query(`
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

        for (const [key, value] of Object.entries(defaultSettings)) {
            await client.query(`
                INSERT INTO settings (key, value) 
                VALUES ($1, $2)
                ON CONFLICT (key) DO NOTHING;
            `, [key, value]);
        }

        console.log(`✅ Database tables initialized successfully.`);
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
            console.log(`🔧 Setting ${key} -> ${value} for group: ${jid}`);
            await pool.query(`
                INSERT INTO group_settings (jit, key, value)
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
    console.log(`🔧 Updating setting for group ${jid}: ${key} -> ${value}`);
    try {
        const valueToStore = typeof value === 'boolean' ? (value ? 'true' : 'false') : value;
        await pool.query(`
            INSERT INTO group_settings (jid, key, value)
            VALUES ($1, $2, $3)
            ON CONFLICT (jid, key) DO UPDATE
            SET value = EXCLUDED.value;
        `, [jid, key, valueToStore]);
        console.log(`✅ Group setting updated: ${jid}, ${key} -> ${value}`);
    } catch (error) {
        console.error(`❌ Error updating setting for group ${jid}: ${key}: ${error}`);
    }
}

async function getAllGroupSettings() {
    try {
        const res = await pool.query(`
            SELECT * FROM group_settings;
        `);
        console.log(`✅ Fetched all group settings successfully.`);
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
        console.log(`✅ Fetched global settings successfully.`);
        return settings;
    } catch (error) {
        console.error(`❌ Error fetching global settings: ${error}`);
        return {};
    }
}

async function updateSetting(key, value) {
    console.log(`🔧 Updating global setting: ${key} -> ${value}`);
    try {
        await pool.query(`
            INSERT INTO settings (key, value) 
            VALUES ($1, $2)
            ON CONFLICT (key) DO UPDATE 
            SET value = EXCLUDED.value;
        `, [key, value]);
        console.log(`✅ Global setting updated: ${key} -> ${value}`);
    } catch (error) {
        console.error(`❌ Error updating global setting: ${key}: ${error}`);
    }
}

async function banUser(num) {
    try {
        await pool.query(`INSERT INTO banned_users (num) VALUES ($1) ON CONFLICT (num) DO NOTHING;`, [num]);
        console.log(`✅ User ${num} banned successfully.`);
    } catch (error) {
        console.error(`❌ Error banning user ${num}: ${error}`);
    }
}

async function unbanUser(num) {
    try {
        await pool.query(`DELETE FROM banned_users WHERE num = $1;`, [num]);
        console.log(`✅ User ${num} unbanned successfully.`);
    } catch (error) {
        console.error(`❌ Error unbanning user ${num}: ${error}`);
    }
}

async function addSudoUser(num) {
    try {
        await pool.query(`INSERT INTO sudo_users (num) VALUES ($1) ON CONFLICT (num) DO NOTHING;`, [num]);
        console.log(`✅ Sudo user ${num} added successfully.`);
    } catch (error) {
        console.error(`❌ Error adding sudo user ${num}: ${error}`);
    }
}

async function removeSudoUser(num) {
    try {
        await pool.query(`DELETE FROM sudo_users WHERE num = $1;`, [num]);
        console.log(`✅ Sudo user ${num} removed successfully.`);
    } catch (error) {
        console.error(`❌ Error removing sudo user ${num}: ${error}`);
    }
}

async function getSudoUsers() {
    try {
        const res = await pool.query('SELECT num FROM sudo_users');
        console.log(`✅ Fetched sudo users successfully.`);
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
        console.log(`✅ Conversation saved for ${num}.`);
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
        console.log(`✅ Fetched recent messages for ${num}.`);
        return res.rows;
    } catch (error) {
        console.error(`❌ Error retrieving conversation history for ${num}: ${error}`);
        return [];
    }
}

async function deleteUserHistory(num) {
    try {
        await pool.query('DELETE FROM conversation_history WHERE num = $1', [num]);
        console.log(`✅ Deleted conversation history for ${num}.`);
    } catch (error) {
        console.error(`❌ Error deleting conversation history for ${num}: ${error}`);
    }
}

async function getBannedUsers() {
    try {
        const res = await pool.query('SELECT num FROM banned_users');
        console.log(`✅ Fetched banned users successfully.`);
        return res.rows.map(row => row.num);
    } catch (error) {
        console.error(`❌ Error fetching banned users: ${error}`);
        return [];
    }
}

initializeDatabase().catch(console.error);

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