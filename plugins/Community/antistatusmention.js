const { getGroupSettings, updateGroupSetting, getWarnLimit } = require('../../database/config');

module.exports = async (context) => {
    const { client, m, args, isAdmin, isBotAdmin } = context;

    const fmt = (msg) => `╭───(    TOXIC-MD    )───\n├───≫ ANTISTATUSMENTION ≪───\n├ \n├ ${msg}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

    if (!m.isGroup) {
        return await client.sendMessage(m.chat, { text: fmt('Groups only, genius. 😤') }, { quoted: m });
    }

    if (!isAdmin) {
        return await client.sendMessage(m.chat, { text: fmt("Admins only. You're not special enough. 😒") }, { quoted: m });
    }

    if (!isBotAdmin) {
        return await client.sendMessage(m.chat, { text: fmt("Make me admin first. I can't delete messages without power. 🙄") }, { quoted: m });
    }

    try {
        const groupSettings = await getGroupSettings(m.chat);
        const value = args.join(" ").toLowerCase();
        const validModes = ["off", "warn", "kick"];

        if (validModes.includes(value)) {
            const currentMode = String(groupSettings.antistatusmention || "off").toLowerCase();
            if (currentMode === value) {
                return await client.sendMessage(m.chat, { text: fmt(`AntiStatusMention is already *${value.toUpperCase()}*. Pay attention. 😒`) }, { quoted: m });
            }
            await updateGroupSetting(m.chat, 'antistatusmention', value);
            const desc =
                value === 'off' ? 'Status mentions are now allowed. Hope that\'s intentional. 🙄' :
                value === 'warn' ? `Status mentions deleted + user warned.\nHit the warn limit and they\'re KICKED. 😈` :
                'Status mention = Instant kick. Zero tolerance. 😈';
            return await client.sendMessage(m.chat, { text: fmt(`✅ AntiStatusMention set to *${value.toUpperCase()}*.\n├ ${desc}`) }, { quoted: m });
        }

        const currentMode = String(groupSettings.antistatusmention || "off").toUpperCase();
        const warnLimit = await getWarnLimit(m.chat);

        await client.sendMessage(m.chat, {
            text: fmt(`Current mode: *${currentMode}*\n├ Warn limit: *${warnLimit}* (set with .setwarncount)\n├ \n├ 📖 *How to use:*\n├ .antistatusmention off — Allow status mentions\n├ .antistatusmention warn — Delete + warn user\n├ .antistatusmention kick — Delete + instant kick\n├ \n├ In warn mode, hitting the limit\n├ = auto kick. 😈\n├ \n├ Aliases: .antimention`)
        }, { quoted: m });
    } catch (error) {
        console.error("AntiStatusMention command error:", error);
        await client.sendMessage(m.chat, { text: fmt('Something broke. Try again. 😤') }, { quoted: m });
    }
};
