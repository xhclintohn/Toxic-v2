const { getGroupSettings, updateGroupSetting, getWarnLimit } = require('../../database/config');

module.exports = async (context) => {
    const { client, m, args, isAdmin, isBotAdmin } = context;

    const fmt = (msg) => `╭───(    TOXIC-MD    )───\n├───≫ ANTILINK ≪───\n├ \n├ ${msg}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

    if (!m.isGroup) {
        return await client.sendMessage(m.chat, { text: fmt('Groups only, genius. 😤') }, { quoted: m });
    }

    if (!isAdmin) {
        return await client.sendMessage(m.chat, { text: fmt("Admins only. You're not special enough. 😒") }, { quoted: m });
    }

    if (!isBotAdmin) {
        return await client.sendMessage(m.chat, { text: fmt("Make me admin first. I can't enforce rules without power. 🙄") }, { quoted: m });
    }

    try {
        const groupSettings = await getGroupSettings(m.chat);
        const value = args.join(" ").toLowerCase();
        const validModes = ["off", "warn", "kick"];

        if (validModes.includes(value)) {
            const currentMode = String(groupSettings.antilink || "off").toLowerCase();
            if (currentMode === value) {
                return await client.sendMessage(m.chat, { text: fmt(`Antilink is already set to *${value.toUpperCase()}*. Pay attention. 😒`) }, { quoted: m });
            }
            await updateGroupSetting(m.chat, 'antilink', value);
            const desc =
                value === 'off' ? 'Links are now allowed. Hope you know what you\'re doing. 🙄' :
                value === 'warn' ? `Links will be deleted and sender warned.\nAt the warn limit they\'re KICKED. 😈` :
                'Links = Instant kick. No second chances. 😈';
            return await client.sendMessage(m.chat, { text: fmt(`✅ Antilink set to *${value.toUpperCase()}*.\n├ ${desc}`) }, { quoted: m });
        }

        const currentMode = String(groupSettings.antilink || "off").toUpperCase();
        const warnLimit = await getWarnLimit(m.chat);

        await client.sendMessage(m.chat, {
            text: fmt(`Current mode: *${currentMode}*\n├ Warn limit: *${warnLimit}* (set with .setwarncount)\n├ \n├ 📖 *How to use:*\n├ .antilink off — Allow links\n├ .antilink warn — Delete + warn user\n├ .antilink kick — Delete + instant kick\n├ \n├ In warn mode, hitting the limit\n├ = auto kick. 😈`)
        }, { quoted: m });
    } catch (error) {
        console.error("Antilink command error:", error);
        await client.sendMessage(m.chat, { text: fmt('Something broke. Try again. 😤') }, { quoted: m });
    }
};
