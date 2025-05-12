const middleware = require('../../utility/botUtil/middleware');

module.exports = async (context) => {
    await middleware(context, async () => {
        const { client, m, botname } = context;

        if (!botname) {
            console.error(`Botname not set, you useless fuck.`);
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Bot’s fucked. No botname in context. Yell at your dev, dipshit.\n◈━━━━━━━━━━━━━━━━◈`);
        }

        if (!m.isGroup) {
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, ${m.pushName}, you dumb fuck! This ain’t a group! Stop wasting my time! 🚫\n◈━━━━━━━━━━━━━━━━◈`);
        }

        // Check if bot is admin
        let groupMetadata;
        try {
            groupMetadata = await client.groupMetadata(m.chat);
        } catch (e) {
            console.error(`[DEBUG] Error fetching group metadata: ${e}`);
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ SYSTEM’S FUCKED, ${m.pushName}! 😤 Couldn’t get group data: ${e.message}. Fix this shit! 🚫\n◈━━━━━━━━━━━━━━━━◈`);
        }

        const members = groupMetadata.participants;
        const admins = members.filter(p => p.admin != null).map(p => p.id);
        const botId = client.user.id;
        if (!admins.includes(botId)) {
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ OI, ${m.pushName}! 😤 I ain’t admin, so I can’t demote anyone! Make me admin or FUCK OFF! 🚫\n◈━━━━━━━━━━━━━━━━◈`);
        }

        // Check for mentioned or quoted user
        if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ You brain-dead moron, ${m.pushName}! 😡 Mention or quote a user to demote, you useless shit!\n◈━━━━━━━━━━━━━━━━◈`);
        }

        const user = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null);
        if (!user) {
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ What the fuck, ${m.pushName}? 😳 No valid user to demote! Try again, you idiot!\n◈━━━━━━━━━━━━━━━━◈`);
        }

        const userNumber = user.split('@')[0];
        const userName = m.mentionedJid[0] ? (members.find(p => p.id === user)?.name || userNumber) : (m.quoted?.pushName || userNumber);

        // Protect the owner
        if (user === '254735342808@s.whatsapp.net') {
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ YOU PATHETIC WORM, ${m.pushName}! 😤 Trying to demote the SUPREME BOSS? You’re LOWER THAN DIRT! 🦄\n◈━━━━━━━━━━━━━━━━◈`);
        }

        // Check if user is admin
        if (!admins.includes(user)) {
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, ${m.pushName}, you dumbass! 😎 ${userName} ain’t even admin! Stop fucking around!\n◈━━━━━━━━━━━━━━━━◈`);
        }

        try {
            await client.groupParticipantsUpdate(m.chat, [user], 'demote');
            await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ HAHA, ${userName} GOT STRIPPED! 😈 No more admin for this loser, thanks to *${botname}*! Beg for mercy, you trash! 🎗️\n◈━━━━━━━━━━━━━━━━◈`, { mentions: [user] });
        } catch (error) {
            console.error(`Demote command fucked up: ${error.stack}`);
            await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke, ${m.pushName}! 😤 Couldn’t demote ${userName}: ${error.message}. Try later, you incompetent fuck!\n◈━━━━━━━━━━━━━━━━◈`);
        }
    });
};