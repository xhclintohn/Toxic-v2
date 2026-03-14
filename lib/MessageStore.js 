const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.resolve(__dirname, '../whatsasena.db'));
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -8000');
db.pragma('temp_store = MEMORY');

db.exec(`
    CREATE TABLE IF NOT EXISTS msg_store (
        id TEXT NOT NULL,
        jid TEXT NOT NULL,
        sender TEXT,
        message TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        PRIMARY KEY (id, jid)
    );
    CREATE INDEX IF NOT EXISTS idx_msg_store_id ON msg_store(id);
    CREATE INDEX IF NOT EXISTS idx_msg_store_jid ON msg_store(jid);
    CREATE INDEX IF NOT EXISTS idx_msg_store_ts ON msg_store(timestamp);
`);

const stmtUpsert = db.prepare(`
    INSERT OR REPLACE INTO msg_store (id, jid, sender, message, timestamp)
    VALUES (?, ?, ?, ?, ?)
`);

const stmtGetById = db.prepare(`SELECT * FROM msg_store WHERE id = ? LIMIT 1`);

const stmtDelete = db.prepare(`DELETE FROM msg_store WHERE id = ? AND jid = ?`);

const stmtCleanup = db.prepare(`DELETE FROM msg_store WHERE timestamp < ?`);

function saveMessage(id, jid, sender, messageObj) {
    try {
        stmtUpsert.run(id, jid, sender || '', JSON.stringify(messageObj), Date.now());
    } catch (e) {
        console.error('❌ [MSG_STORE] Save error:', e.message);
    }
}

function getMessage(id) {
    try {
        const row = stmtGetById.get(id);
        if (!row) return null;
        return {
            id: row.id,
            jid: row.jid,
            sender: row.sender,
            message: JSON.parse(row.message),
            timestamp: row.timestamp
        };
    } catch (e) {
        console.error('❌ [MSG_STORE] Get error:', e.message);
        return null;
    }
}

function deleteMessage(id, jid) {
    try {
        stmtDelete.run(id, jid);
    } catch (e) {}
}

function cleanupOldMessages(maxAgeMs = 12 * 60 * 60 * 1000) {
    try {
        stmtCleanup.run(Date.now() - maxAgeMs);
    } catch (e) {}
}

setInterval(() => cleanupOldMessages(), 12 * 60 * 60 * 1000);

module.exports = { saveMessage, getMessage, deleteMessage, cleanupOldMessages };
