const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware'); 

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, Owner, participants, botname } = context;

        if (!botname) {
            console.error(`Botname not set, you incompetent fuck.`);
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Bot’s fucked. No botname in context. Yell at your dev, dumbass.\n◈━━━━━━━━━━━━━━━━◈`);
        }

        if (!Owner) {
            console.error(`Owner not set, you brain-dead moron.`);
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Bot’s broken. No owner in context. Go cry to the dev.\n◈━━━━━━━━━━━━━━━━◈`);
        }

        if (!m.isGroup) {
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ You think I’m bailing on your pathetic DMs? This is for groups, you idiot.\n◈━━━━━━━━━━━━━━━━◈`);
        }

        const maxMentions = 50;
        const mentions = participants.slice(0, maxMentions).map(a => a.id);
        await client.sendMessage(m.chat, { 
            text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, ${m.pushName}, you sure you want ${botname} to ditch these worthless losers? Reply 'yes' to confirm, you spineless fuck.\n◈━━━━━━━━━━━━━━━━◈`, 
            mentions: [m.sender] 
        }, { quoted: m });

        // Hypothetical waitForReply helper (code it yourself, you lazy shit)
        const response = await client.waitForReply(m.chat, m.sender, 30);
        if (!response || response.text.toLowerCase() !== 'yes') {
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Pussy move, ${m.pushName}. I’m stuck with these clowns ‘cause of you.\n◈━━━━━━━━━━━━━━━━◈`);
        }

        try {
            await client.sendMessage(m.chat, { 
                text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Fuck this shithole 🖕 ${botname} is out! Good luck rotting without me, you nobodies. ${mentions.length < participants.length ? 'Too many losers to tag, pathetic.' : ''}\n◈━━━━━━━━━━━━━━━━◈`, 
                mentions 
            }, { quoted: m });
            await client.groupLeave(m.chat);
        } catch (error) {
            console.error(`Couldn’t ditch the group, you useless fuck: ${error.stack}`);
            await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke. Can’t escape this dumpster fire. Try again, loser.\n◈━━━━━━━━━━━━━━━━◈`);
        }
    });
};