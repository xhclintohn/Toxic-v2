const { readdirSync, statSync, unlinkSync, existsSync } = require('fs');
const { join } = require('path');
const { getFakeQuoted } = require('../../lib/fakeQuoted');

module.exports = {
    name: 'cleartmp',
    alias: ['clearcache', 'clrtmp'],
    description: 'Delete all temporary files (Owner only)',
    run: async (context) => {
        const { client, m, isOwner } = context;
        const fq = getFakeQuoted(m);
        if (!isOwner) return m.reply('Owner only command.');
        const tmpDirs = ['./tmp', './temp'].filter(d => existsSync(d));
        if (!tmpDirs.length) return m.reply('No tmp directories found.');
        let deleted = 0;
        let skipped = 0;
        for (const dir of tmpDirs) {
            for (const file of readdirSync(dir)) {
                const fp = join(dir, file);
                try {
                    if (statSync(fp).isFile()) {
                        unlinkSync(fp);
                        deleted++;
                    } else {
                        skipped++;
                    }
                } catch {
                    skipped++;
                }
            }
        }
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ TMP CLEANED ≪───\n├ \n├ ✅ Deleted: ${deleted} file(s)\n├ ⏩ Skipped: ${skipped} item(s)\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};
