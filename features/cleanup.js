const { readdirSync, statSync, unlinkSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');

const TMP_DIRS = ['./tmp', './temp'];
const MAX_AGE_MS = 3 * 60 * 60 * 1000;
const INTERVAL_MS = 6 * 60 * 60 * 1000;

function cleanTmp(maxAgeMs = MAX_AGE_MS) {
    let deleted = 0;
    const now = Date.now();
    for (const dir of TMP_DIRS) {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
            continue;
        }
        for (const file of readdirSync(dir)) {
            const fp = join(dir, file);
            try {
                const stat = statSync(fp);
                if (stat.isFile() && now - stat.mtimeMs > maxAgeMs) {
                    unlinkSync(fp);
                    deleted++;
                }
            } catch {}
        }
    }
    if (deleted > 0) console.log(`[cleanup] Deleted ${deleted} stale tmp file(s)`);
}

function startCleanupScheduler() {
    cleanTmp();
    setInterval(() => cleanTmp(), INTERVAL_MS);
}

module.exports = { cleanTmp, startCleanupScheduler };

startCleanupScheduler();
