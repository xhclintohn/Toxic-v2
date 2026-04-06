const { resetWarn, getWarnCount } = require('../../database/config');

module.exports = {
    name: 'resetwarn',
    alias: ['delwarn', 'clearwarn'],
    description: 'Reset warns for a user',
    run: async (context) => {
        const { client, m, isAdmin, isBotAdmin } = context;

        if (!m.isGroup) return m.reply(`╭───(    TOXIC-MD    )───\n├ Group only.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        if (!isAdmin && !isBotAdmin) return m.reply(`╭───(    TOXIC-MD    )───\n├ Admin only.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

        const target = m.quoted?.sender || m.mentionedJid?.[0];
        if (!target) return m.reply(`╭───(    TOXIC-MD    )───\n├ Reply or mention the user.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

        const userNum = target.split('@')[0].split(':')[0];
        await resetWarn(m.chat, userNum);

        return client.sendMessage(m.chat, {
            text: `╭───(    TOXIC-MD    )───\n├ Warns cleared for @${userNum} 🧹\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
            mentions: [target]
        });
    }
};
