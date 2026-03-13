const { getGroupSettings, updateGroupSetting } = require('../../database/config');

module.exports = async (context) => {
    const { client, m, args, prefix, isAdmin } = context;
    const jid = m.chat;

    const fmt = (msg) => {
        return `╭───(    TOXIC-MD    )───\n├───≫ Gᴏᴏᴅʙʏᴇ ≪───\n├ \n├ ${msg}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
    };

    try {
        if (!jid.endsWith('@g.us')) {
            return await client.sendMessage(m.chat, { text: fmt("Oi! This only works in groups. Not your personal DM, genius.") }, { quoted: m });
        }

        if (!isAdmin) {
            return await client.sendMessage(m.chat, { text: fmt("Only group admins can toggle goodbye messages.\n├ You're not special.") }, { quoted: m });
        }

        const groupSettings = await getGroupSettings(jid);
        const isEnabled = groupSettings?.goodbye === true || groupSettings?.goodbye === 1;
        const value = args[0]?.toLowerCase();

        if (value === 'on' || value === 'off') {
            const action = value === 'on';
            if (isEnabled === action) {
                return await client.sendMessage(m.chat, { text: fmt(`Bruh 🙄 Goodbye is already ${value.toUpperCase()} in this group. Were you dropped as a kid?`) }, { quoted: m });
            }
            await updateGroupSetting(jid, 'goodbye', action);
            return await client.sendMessage(m.chat, {
                text: fmt(`Goodbye messages ${value.toUpperCase()}! 🔥 ${action ? "Leavers will get roasted on their way out 😈" : "Let them leave in silence like the nobodies they are 🧊"}`)
            }, { quoted: m });
        }

        await client.sendMessage(m.chat, {
            text: fmt(`Goodbye Status: *${isEnabled ? 'ON 🥶' : 'OFF 😴'}*\n├ Usage: *${prefix}goodbye on/off*\n├ Toggles goodbye messages for members leaving this group.`),
            buttons: [
                { buttonId: `${prefix}goodbye on`, buttonText: { displayText: 'ON 🥶' }, type: 1 },
                { buttonId: `${prefix}goodbye off`, buttonText: { displayText: 'OFF 😴' }, type: 1 },
            ],
            headerType: 1,
            viewOnce: true,
        }, { quoted: m });
    } catch (error) {
        console.error('Toxic-MD: Error in goodbye.js:', error);
        await client.sendMessage(m.chat, { text: fmt(`Something crashed. Typical. 💀 Error: ${error.message}`) }, { quoted: m });
    }
};