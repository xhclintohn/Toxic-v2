const middleware = require('../../utils/botUtil/middleware');

module.exports = async (context) => {
    await middleware(context, async () => {
        const { client, m, participants, isBotAdmin } = context;

        if (!m.isGroup) return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ This command is meant for groups.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        if (!isBotAdmin) return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ I need admin privileges.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

        const botJid = client.decodeJid(client.user.id);
        const usersToKick = participants.filter(v => v.id !== botJid && v.id !== m.sender);

        await client.sendMessage(m.chat, { react: { text: '⚠️', key: m.key } });
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ TERMINATION ≪───\n├ \n├ GROUP TERMINATION INITIATED\n├ This will remove all ${usersToKick.length} participants.\n├ The group will be renamed.\n├ THIS PROCESS CANNOT BE STOPPED.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

        await client.groupUpdateSubject(m.chat, "Proven Useless🦄🚮");
        await client.groupUpdateDescription(m.chat, "Terminated by Tσxιƈ-ɱԃȥ\n\nA collection of digital disappointments. Your contributions were as valuable as your existence—negligible.");
        await client.groupRevokeInvite(m.chat);
        await client.groupSettingUpdate(m.chat, 'announcement');

        await client.groupParticipantsUpdate(m.chat, usersToKick.map(v => v.id), 'remove');

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ COMPLETE ≪───\n├ \n├ TERMINATION COMPLETE\n├ All participants removed.\n├ Group secured.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    });
};
