const { db, clearOldConversationHistory } = require('../database/config');
const fs = require('fs');
const path = require('path');

function cleanJunkFiles() {
    const dirs = [
        path.resolve('./tmp'),
        path.resolve('./media'),
        path.resolve('./downloads'),
    ];
    const exts = new Set(['.jpg','.jpeg','.png','.mp4','.mp3','.webp','.gif','.ogg','.opus','.pdf','.webm','.aac']);
    const limit = 24 * 60 * 60 * 1000;
    for (const dir of dirs) {
        if (!fs.existsSync(dir)) continue;
        try {
            for (const file of fs.readdirSync(dir)) {
                if (!exts.has(path.extname(file).toLowerCase())) continue;
                const fp = path.join(dir, file);
                try {
                    if (Date.now() - fs.statSync(fp).mtimeMs > limit) fs.unlinkSync(fp);
                } catch {}
            }
        } catch {}
    }
    try { db.pragma('wal_checkpoint(TRUNCATE)'); } catch {}
    console.log('Junk cleanup done');
}

setInterval(() => { clearOldConversationHistory(5); }, 5 * 60 * 60 * 1000);
setInterval(cleanJunkFiles, 24 * 60 * 60 * 1000);

module.exports = { cleanJunkFiles };
