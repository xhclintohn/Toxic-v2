const { updateGroupSetting } = require("../Database/config");

module.exports = async (context) => {
    const { client, m, text, botname } = context;

    if (!botname) {
        console.error(`Botname not set, you useless fuck.`);
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Bot’s fucked. No botname in context. Yell at your dev, dipshit.\n◈━━━━━━━━━━━━━━━━◈`);
    }

    if (!m.isGroup) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ This command is for groups, you moron! Get out of my DMs.\n◈━━━━━━━━━━━━━━━━◈`);
    }

    const groupMetadata = await client.groupMetadata(m.chat);
    const groupAdmins = groupMetadata.participants.filter(p => p.admin != null).map(p => p.id);
    if (!groupAdmins.includes(m.sender)) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Only admins can fuck with antilink, @${m.sender.split("@")[0]}! 😤 Step up or shut up.\n◈━━━━━━━━━━━━━━━━◈`, { mentions: [m.sender] });
    }

    const arg = text.toLowerCase().trim();
    if (!arg || !['on', 'off'].includes(arg)) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, ${m.pushName}, use .antilink on/off, you brain-dead fuckwit!\n◈━━━━━━━━━━━━━━━━◈`);
    }

    try {
        const value = arg === 'on';
        await updateGroupSetting(m.chat, 'antilink', value);
        await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Antilink ${value ? 'ENABLED' : 'DISABLED'} by @${m.sender.split("@")[0]}! 😤 ${value ? 'Links get shredded now!' : 'Links are free, you soft losers.'}\n◈━━━━━━━━━━━━━━━━◈`, { mentions: [m.sender] });
    } catch (error) {
        console.error(`[ANTILINK-ERROR] Failed to update antilink setting: ${error.stack}`);
        await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke, ${m.pushName}! 😡 Couldn’t set antilink: ${error.message}. Try again, you twat.\n◈━━━━━━━━━━━━━━━━◈`);
    }
};