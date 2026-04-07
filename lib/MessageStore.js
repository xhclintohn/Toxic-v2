const { saveMessage, getMessage, deleteMessage, cleanupOldMsgStore } = require('../database/config');

function cleanupOldMessages(maxAgeMs = 12 * 60 * 60 * 1000) {
    cleanupOldMsgStore(maxAgeMs);
}

module.exports = { saveMessage, getMessage, deleteMessage, cleanupOldMessages };
