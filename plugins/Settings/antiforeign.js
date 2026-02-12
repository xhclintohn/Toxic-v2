const { getSettings, getGroupSetting, updateGroupSetting } = require('../../database/config');
const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

module.exports = async (context) => {
  await ownerMiddleware(context, async () => {
    const { client, m, args, prefix } = context;
    const value = args[0]?.toLowerCase();
    const jid = m.chat;

    if (!jid.endsWith('@g.us')) {
      return await m.reply(
        `╭───(    TOXIC-MD    )───\n` +
        `├───≫ ANTIFOREIGN ≪───\n` +
        `├ \n` +
        `├ Yo, dumbass, this command's for groups only. Get lost.\n` +
        `╰──────────────────☉\n` +
        `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
      );
    }

    try {
      const settings = await getSettings();
      if (!settings) {
        return await m.reply(
          `╭───(    TOXIC-MD    )───\n` +
          `├───≫ ANTIFOREIGN ≪───\n` +
          `├ \n` +
          `├ Database is fucked, no settings found. Fix it, loser.\n` +
          `╰──────────────────☉\n` +
          `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        );
      }

      let groupSettings = await getGroupSetting(jid);
      if (!groupSettings) {
        return await m.reply(
          `╭───(    TOXIC-MD    )───\n` +
          `├───≫ ANTIFOREIGN ≪───\n` +
          `├ \n` +
          `├ No group settings found. Database's acting up, try again.\n` +
          `╰──────────────────☉\n` +
          `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        );
      }

      let isEnabled = groupSettings?.antiforeign === true;

      const Myself = await client.decodeJid(client.user.id);
      const groupMetadata = await client.groupMetadata(m.chat);
      const userAdmins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id);
      const isBotAdmin = userAdmins.includes(Myself);

      if (value === 'on' || value === 'off') {
        if (!isBotAdmin) {
          return await m.reply(
            `╭───(    TOXIC-MD    )───\n` +
            `├───≫ ANTIFOREIGN ≪───\n` +
            `├ \n` +
            `├ Make me an admin first, you clown. Can't touch antiforeign without juice.\n` +
            `╰──────────────────☉\n` +
            `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
          );
        }

        const action = value === 'on';

        if (isEnabled === action) {
          return await m.reply(
            `╭───(    TOXIC-MD    )───\n` +
            `├───≫ ANTIFOREIGN ≪───\n` +
            `├ \n` +
            `├ Antiforeign's already ${value.toUpperCase()}, genius. Stop wasting my time.\n` +
            `╰──────────────────☉\n` +
            `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
          );
        }

        await updateGroupSetting(jid, 'antiforeign', action);
        await m.reply(
          `╭───(    TOXIC-MD    )───\n` +
          `├───≫ ANTIFOREIGN ≪───\n` +
          `├ \n` +
          `├ Antiforeign's now ${value.toUpperCase()}. Foreigners better watch out or get yeeted!\n` +
          `╰──────────────────☉\n` +
          `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        );
      } else {
        await m.reply(
          `╭───(    TOXIC-MD    )───\n` +
          `├───≫ ANTIFOREIGN ≪───\n` +
          `├ \n` +
          `├ Antiforeign's ${isEnabled ? 'ON' : 'OFF'} in this group, dipshit.\n` +
          `├ Use ${prefix}antiforeign on or ${prefix}antiforeign off to change it.\n` +
          `╰──────────────────☉\n` +
          `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        );
      }
    } catch (error) {
      console.error('[Antiforeign] Error in command:', error);
      await m.reply(
        `╭───(    TOXIC-MD    )───\n` +
        `├───≫ ANTIFOREIGN ≪───\n` +
        `├ \n` +
        `├ Shit broke, couldn't mess with antiforeign. Database or something's fucked. Try later.\n` +
        `╰──────────────────☉\n` +
        `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
      );
    }
  });
};
