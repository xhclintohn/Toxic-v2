const { getGroupSettings, updateGroupSetting } = require('../../database/config');
const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, args, prefix } = context;
        const value = args[0]?.toLowerCase();
        const jid = m.chat;

        const formatStylishReply = (title, message) => {
            return `╭───(    TOXIC-MD    )───\n├───≫ ${title} ≪───\n├ \n├ ${message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
        };

        if (!jid.endsWith('@g.us')) {
            return await client.sendMessage(m.chat, { text: formatStylishReply("ANTITAG", "This command can only be used in groups, fool!") }, { quoted: m });
        }

        let groupSettings = await getGroupSettings(jid);
        let isEnabled = groupSettings?.antitag === true;

        const Myself = await client.decodeJid(client.user.id);
        const groupMetadata = await client.groupMetadata(m.chat);
        const userAdmins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id);
        const isBotAdmin = userAdmins.includes(Myself);

        if (value === 'on' && !isBotAdmin) {
            return await client.sendMessage(m.chat, { text: formatStylishReply("ANTITAG", "I need admin privileges to enable Antitag, you clown!") }, { quoted: m });
        }

        if (value === 'on' || value === 'off') {
            const action = value === 'on';

            if (isEnabled === action) {
                return await client.sendMessage(m.chat, { text: formatStylishReply("ANTITAG", `Antitag is already ${value.toUpperCase()}, genius!`) }, { quoted: m });
            }

            await updateGroupSetting(jid, 'antitag', action ? 'true' : 'false');
            await client.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } });
            return await client.sendMessage(m.chat, { text: formatStylishReply("ANTITAG", `Antitag has been turned ${value.toUpperCase()} for this group.`) }, { quoted: m });
        }

        const buttons = [
            { buttonId: `${prefix}antitag on`, buttonText: { displayText: "ON" }, type: 1 },
            { buttonId: `${prefix}antitag off`, buttonText: { displayText: "OFF" }, type: 1 },
        ];

        await client.sendMessage(m.chat, {
            text: formatStylishReply("ANTITAG", `Antitag's ${isEnabled ? 'ON' : 'OFF'} right now. Pick one, peasant!`),
            buttons,
            headerType: 1,
            viewOnce: true,
        }, { quoted: m });
    });
};
