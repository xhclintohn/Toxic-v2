const { Pool } = require('pg');
const { database } = require('../Env/settings');

console.log('[DB] Initializing database connection...');

const pool = new Pool({
  connectionString: database,
  ssl: { rejectUnauthorized: false }
});

async function initializeDatabase() {
  const client = await pool.connect();
  console.log('[DB] Checking and creating settings tables...');
  try {
    await client.query('BEGIN');

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
        value BOOLEAN NOT NULL,
        PRIMARY KEY (jid, key)
      );
      CREATE INDEX IF NOT EXISTS idx_group_settings_jid ON group_settings(jid);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS conversation_history (
        id SERIAL PRIMARY KEY,
        num TEXT NOT NULL,
        role TEXT NOT NULL,
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
      packname: '𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧',
      mode: 'public',
      presence: 'online',
      autoview: 'true',
      autolike: 'true',
      autoread: 'false',
      autobio: 'false',
      anticall: 'false',
      reactEmoji: '🖤'
    };

    for (const [key, value] of Object.entries(defaultSettings)) {
      await client.query(`
        INSERT INTO settings (key, value)
        VALUES ($1, $2)
        ON CONFLICT (key) DO NOTHING;
      `, [key, value]);
    }

    await client.query('COMMIT');
    console.log('[DB] Database tables initialized successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[DB] Error initializing database:', error);
  } finally {
    client.release();
  }
}

const defaultGroupSettings = {
  antitag: false,
  antidelete: true,
  gcpresence: false,
  antiforeign: false,
  antidemote: false,
  antipromote: false,
  events: false,
  antilink: false
};

async function initializeGroupSettings(jid) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [key, value] of Object.entries(defaultGroupSettings)) {
      console.log(`[DB] Checking/Setting ${key} -> ${value} for group: ${jid}`);
      await client.query(`
        INSERT INTO group_settings (jid, key, value)
        VALUES ($1, $2, $3)
        ON CONFLICT (jid, key) DO NOTHING;
      `, [jid, key, value]);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`[DB] Error initializing group settings for ${jid}:`, error);
  } finally {
    client.release();
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
      settings[row.key] = row.value;
    });

    return settings;
  } catch (error) {
    console.error(`[DB] Error fetching group settings for ${jid}:`, error);
    return null;
  }
}

async function updateGroupSetting(jid, key, value) {
  console.log(`[DB] Updating setting for group ${jid}: ${key} -> ${value}`);
  try {
    await pool.query(`
      INSERT INTO group_settings (jid, key, value)
      VALUES ($1, $2, $3)
      ON CONFLICT (jid, key) DO UPDATE
      SET value = EXCLUDED.value;
    `, [jid, key, value]);
  } catch (error) {
    console.error(`[DB] Error updating setting for group ${jid}: ${key}`, error);
  }
}

async function getAllGroupSettings() {
  try {
    const res = await pool.query(`
      SELECT * FROM group_settings;
    `);
    return res.rows;
  } catch (error) {
    console.error('[DB] Error fetching all group settings:', error);
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
    console.error('[DB] Error fetching settings:', error);
    return null;
  }
}

async function updateSetting(key, value) {
  console.log(`[DB] Updating setting: ${key} -> ${value}`);
  try {
    await pool.query(`
      INSERT INTO settings (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value;
    `, [key, value]);
    console.log(`[DB] Setting updated successfully: ${key} -> ${value}`);
  } catch (error) {
    console.error(`[DB] Error updating setting: ${key}`, error);
  }
}

async function banUser(num) {
  try {
    await pool.query(`INSERT INTO banned_users (num) VALUES ($1) ON CONFLICT (num) DO NOTHING;`, [num]);
    console.log(`[DB] User ${num} banned successfully.`);
  } catch (error) {
    console.error(`[DB] Error banning user ${num}:`, error);
  }
}

async function unbanUser(num) {
  try {
    await pool.query(`DELETE FROM banned_users WHERE num = $1;`, [num]);
    console.log(`[DB] User ${num} unbanned successfully.`);
  } catch (error) {
    console.error(`[DB] Error unbanning user ${num}:`, error);
  }
}

async function addSudoUser(num) {
  try {
    await pool.query(`INSERT INTO sudo_users (num) VALUES ($1) ON CONFLICT (num) DO NOTHING;`, [num]);
    console.log(`[DB] Sudo user ${num} added successfully.`);
  } catch (error) {
    console.error(`[DB] Error adding sudo user ${num}:`, error);
  }
}

async function removeSudoUser(num) {
  try {
    await pool.query(`DELETE FROM sudo_users WHERE num = $1;`, [num]);
    console.log(`[DB] Sudo user ${num} removed successfully.`);
  } catch (error) {
    console.error(`[DB] Error removing sudo user ${num}:`, error);
  }
}

async function getSudoUsers() {
  try {
    const res = await pool.query('SELECT num FROM sudo_users');
    return res.rows.map(row => row.num);
  } catch (error) {
    console.error('[DB] Error fetching sudo users:', error);
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
    console.error('[DB] Error saving conversation:', error);
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
    console.error('[DB] Error retrieving conversation history:', error);
    return [];
  }
}

async function deleteUserHistory(num) {
  try {
    await pool.query('DELETE FROM conversation_history WHERE num = $1', [num]);
    console.log(`[DB] Deleted conversation history for ${num}`);
  } catch (error) {
    console.error('[DB] Error deleting conversation history:', error);
  }
}

async function getBannedUsers() {
  try {
    const res = await pool.query('SELECT num FROM banned_users');
    return res.rows.map(row => row.num);
  } catch (error) {
    console.error('[DB] Error fetching banned users:', error);
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