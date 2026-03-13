const { getWarnCount } = require('../../database/config');
const middleware = require('../../utils/botUtil/middleware');

module.exports = async (context) => {
    await middleware(context, async () => {
        const { client, m, args } = context;

        const fmt = (msg) => `╭───(    TOXIC-MD    )───\n├───≫ WARN COUNT ≪───\n├ \n├ ${msg}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

        let target = null;

        if (m.quoted && m.quoted.sender) {
            target = m.quoted.sender;
        } else if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (args[0]) {
            target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        }

        if (!target) {
            return await client.sendMessage(m.chat, { text: fmt('Tag someone or reply to their message. I can\'t read minds, fool. 😒') }, { quoted: m });
        }

        const groupMetadata = await client.groupMetadata(m.chat);
        const targetInGroup = groupMetadata.participants.find(p => p.id === target);

        if (!targetInGroup) {
            return await client.sendMessage(m.chat, { text: fmt("That person isn't even in this group. Are you seeing ghosts? 👻") }, { quoted: m });
        }

        const username = target.split('@')[0];
        const count = await getWarnCount(m.chat, target);

        await client.sendMessage(m.chat, {
            text: `╭───(    TOXIC-MD    )───\n├───≫ WARN COUNT ≪───\n├ \n├ 📊 @${username} has *${count}/3* warnings.\n├ ${count === 0 ? 'Clean record. For now. 😏' : count >= 2 ? 'One more and they\'re OUT. 💀' : 'Walking on thin ice. ⚠️'}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
            mentions: [target]
        }, { quoted: m });
    });
};
