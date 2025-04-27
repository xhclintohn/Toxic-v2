const { getSettings, getGroupSetting, updateGroupSetting } = require('../../Database/config');

module.exports = async (context) => {
    const { client, m, args, botname } = context;

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

    const Myself = await client.decodeJid(client.user.id);
    const isBotAdmin = groupAdmins.includes(Myself);
    const value = args[0]?.toLowerCase();

    if (value === 'on' && !isBotAdmin) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ I need admin privileges to shred links, you dumbass! 😡 Make me admin first.\n◈━━━━━━━━━━━━━━━━◈`);
    }

    if (value === 'on' || value === 'off') {
        try {
            const action = value === 'on';
            const currentSetting = await getGroupSetting(m.chat, 'antilink');
            if (currentSetting === (action ? 'true' : 'false')) {
                return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Antilink is already ${action ? 'ENABLED' : 'DISABLED'}, you brain-dead fuckwit! 😤\n◈━━━━━━━━━━━━━━━━◈`);
            }

            await updateGroupSetting(m.chat, 'antilink', action ? 'true' : 'false');
            await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Antilink ${action ? 'ENABLED' : 'DISABLED'} by @${m.sender.split("@")[0]}! 😤 ${action ? 'Links get shredded now!' : 'Links are free, you soft losers.'}\n◈━━━━━━━━━━━━━━━━◈`, { mentions: [m.sender] });
        } catch (error) {
            console.error(`[ANTILINK-ERROR] Failed to update antilink: ${error.stack}`);
            await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke, ${m.pushName}! 😡 Couldn’t set antilink: ${error.message}. Try again, you twat.\n◈━━━━━━━━━━━━━━━━◈`);
        }
    } else {
        const settings = await getSettings();
        const prefix = settings.prefix;
        const isEnabled = (await getGroupSetting(m.chat, 'antilink')) === 'true';
        await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Antilink is ${isEnabled ? 'ENABLED' : 'DISABLED'} in this group, @${m.sender.split("@")[0]}! 😤\n│❒ Use ${prefix}antilink on/off, you brain-dead fuckwit!\n◈━━━━━━━━━━━━━━━━◈`, { mentions: [m.sender] });
    }
};