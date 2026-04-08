const { getGroupSettings, updateGroupSetting } = require('../../database/config');
const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, args, prefix } = context;
        const jid = m.chat;

        const fmt = (msg) =>
            `╭───(    TOXIC-MD    )───\n├ ${msg}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

        try {
            if (!jid.endsWith('@g.us')) {
                return await client.sendMessage(m.chat, { text: fmt("Oi! 😤 This only works in groups. Not your personal DM, genius. 🖕") }, { quoted: m });
            }

            const groupSettings = await getGroupSettings(jid);
            const isEnabled = groupSettings?.welcome === true || groupSettings?.welcome === 1;
            const value = args[0]?.toLowerCase();

            if (value === 'on' || value === 'off') {
                const action = value === 'on';
                if (isEnabled === action) {
                    return await client.sendMessage(m.chat, { text: fmt(`Bruh 🙄 Welcome is already ${value.toUpperCase()} in this group. Pay attention!`) }, { quoted: m });
                }
                await updateGroupSetting(jid, 'welcome', action);
                return await client.sendMessage(m.chat, {
                    text: fmt(`Welcome messages ${value.toUpperCase()}! 🔥 ${action ? "New members better brace themselves 😈" : "No more warm welcomes. Cold group energy 🧊"}`)
                }, { quoted: m });
            }

            await client.sendMessage(m.chat, {
                text: fmt(`Welcome Status: *${isEnabled ? 'ON 🥶' : 'OFF 😴'}*\n├ Usage: *${prefix}welcome on/off*\n├ Toggles welcome messages for new members in this group.`),
                buttons: [
                    { buttonId: `${prefix}welcome on`, buttonText: { displayText: 'ON 🥶' }, type: 1 },
                    { buttonId: `${prefix}welcome off`, buttonText: { displayText: 'OFF 😴' }, type: 1 },
                ],
                headerType: 1,
                viewOnce: true,
            }, { quoted: m });
        } catch (error) {
            console.error('Toxic-MD: Error in welcome.js:', error);
            await client.sendMessage(m.chat, { text: fmt(`Something crashed. Typical. 💀 Error: ${error.message}`) }, { quoted: m });
        }
    });
};
