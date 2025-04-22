const { getSettings, getSudoUsers, getBannedUsers } = require('../../Database/config');

module.exports = async (context) => {
  const { client, m } = context;

  const settings = await getSettings();
  if (!settings) {
    return await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, dumbass, no settings in the database! Fix your shit and try again.`);
  }

  let response = `◈━━━━━━━━━━━━━━━━◈\n│❒ *Toxic-MD Settings, Bitches*\n`;
  const botName = process.env.BOTNAME || settings.botname || 'Unknown';
  response += `🔥 *Botname*: ${botName} (call me boss)\n`;
  response += `🔥 *Prefix*: ${settings.prefix} (don’t fuck it up)\n`;
  response += `🔥 *Autoread*: ${settings.autoread ? '✅ ON, I see all your crap' : '❌ OFF, I’m blind'}\n`;
  response += `🔥 *Autoview Status*: ${settings.autoview ? '✅ ON, stalking stories' : '❌ OFF, I don’t care'}\n`;
  response += `🔥 *Autolike Status*: ${settings.autolike ? '✅ ON, I’m a simp' : '❌ OFF, no love here'}\n`;
  response += `🔥 *React Emoji*: ${settings.reactEmoji} (my mood, deal with it)\n`;
  response += `🔥 *Sticker Watermark*: ${settings.packname} (my brand, bitches)\n`;
  response += `🔥 *Autobio*: ${settings.autobio ? '✅ ON, flexing 24/7' : '❌ OFF, I’m lowkey'}\n`;
  response += `🔥 *Anticall*: ${settings.anticall ? '✅ ON, no losers calling me' : '❌ OFF, I’m open to clowns'}\n`;
  response += `🔥 *Presence*: ${settings.presence} (that’s my vibe)\n`;

  const sudoUsers = await getSudoUsers();
  response += `\n*Stats for the Haters*\n`;
  response += `👑 *Sudo Users*: ${sudoUsers.length > 0 ? sudoUsers.join(', ') : 'Just me, fuck everyone else'}\n`;

  const groups = await client.groupFetchAllParticipating();
  const groupCount = Object.keys(groups).length;

  const bannedCount = await getBannedUsers();

  response += `🚫 *Banned Losers*: ${bannedCount.length} (keep crying)\n`;
  response += `🏠 *Total Groups*: ${groupCount} (I own these streets)\n`;

  await m.reply(response);
};