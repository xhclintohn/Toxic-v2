const middleware = require('../../utility/botUtil/middleware');

module.exports = async (context) => {
  await middleware(context, async () => {
    const { client, m, botNumber } = context;

    if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
      return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, dumbass, mention a user or quote their message! Don’t make me guess.`);
    }

    const users = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null);
    if (!users) {
      return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ What the hell? No user found. Tag or quote someone, idiot.`);
    }

    const parts = users.split('@')[0];

    if (users === botNumber) {
      return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Nice try, loser, you can’t kick me! I’m the boss here. 🦄`);
    }

    try {
      await client.groupParticipantsUpdate(m.chat, [users], 'remove');
      await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ @${parts} got yeeted from the group! Good riddance, trash. 🚫`, { mentions: [users] });
    } catch (error) {
      console.error('Error in kick command:', error);
      await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Shit went wrong, couldn’t kick @${parts}. Maybe I’m not admin? Fix it, moron.`, { mentions: [users] });
    }
  });
};