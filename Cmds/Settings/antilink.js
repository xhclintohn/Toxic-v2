const { getSettings, getGroupSetting, updateGroupSetting } = require('../../Database/config');
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
  await ownerMiddleware(context, async () => {
    const { client, m, args, prefix } = context;
    const value = args[0]?.toLowerCase();
    const jid = m.chat;

    if (!jid.endsWith('@g.us')) {
      return await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, dumbass, this command’s for groups only. Stop wasting my time.`);
    }

    try {
      const settings = await getSettings();
      if (!settings) {
        return await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ No settings found, database is fucked. Fix it and try again.`);
      }

      let groupSettings = await getGroupSetting(jid);
      let isEnabled = groupSettings?.antilink === true;

      const Myself = await client.decodeJid(client.user.id);
      const groupMetadata = await client.groupMetadata(m.chat);
      const userAdmins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id);
      const isBotAdmin = userAdmins.includes(Myself);

      if (value === 'on' || value === 'off') {
        if (!isBotAdmin) {
          return await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Make me an admin first, you clown. Can’t touch antilink without powers.`);
        }

        const action = value === 'on';

        if (isEnabled === action) {
          return await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Antilink’s already ${value.toUpperCase()}, genius. Stop repeating yourself.`);
        }

        await updateGroupSetting(jid, 'antilink', action);
        await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Antilink’s now ${value.toUpperCase()}. Post links and get yeeted, losers!`);
      } else {
        await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Antilink’s ${isEnabled ? 'ON' : 'OFF'} in this group, dipshit.\n\nUse ${prefix}antilink on or ${prefix}antilink off to change it.`);
      }
    } catch (error) {
      console.error('Error in antilink command:', error);
      await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke, couldn’t mess with antilink. Database or something’s fucked. Try later.`);
    }
  });
};