const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware'); 

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, Owner, participants, botname } = context;

        if (!botname) {
            console.error(`Botname not set, you incompetent fuck.`);
            return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n> 々 Bot’s fucked. No botname in context. Yell at your dev, dumbass.\n╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───`);
        }

        if (!Owner) {
            console.error(`Owner not set, you brain-dead moron.`);
            return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n> 々 Bot’s broken. No owner in context. Go cry to the dev.\n╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───`);
        }

        if (!m.isGroup) {
            return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n> 々 You think I’m bailing on your pathetic DMs? This is for groups, you idiot.\n╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───`);
        }

        try {
            const maxMentions = 50;
            const mentions = participants.slice(0, maxMentions).map(a => a.id);
            await client.sendMessage(m.chat, { 
                text: `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n> 々 Fuck this shithole 🖕 ${botname} is OUT! Good luck rotting without me, you nobodies. ${mentions.length < participants.length ? 'Too many losers to tag, pathetic.' : ''}\n╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───`, 
                mentions 
            }, { quoted: m });
            console.log(`[LEAVE-DEBUG] Leaving group ${m.chat}, mentioned ${mentions.length} participants`);
            await client.groupLeave(m.chat);
        } catch (error) {
            console.error(`[LEAVE-ERROR] Couldn’t ditch the group: ${error.stack}`);
            await m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n> 々 Shit broke, ${m.pushName}! 😡 Can’t escape this dumpster fire: ${error.message}. Try again, loser.\n╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───`);
        }
    });
};