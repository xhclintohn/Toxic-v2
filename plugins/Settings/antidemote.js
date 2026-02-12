const { getSettings, getGroupSetting, updateGroupSetting } = require('../../database/config');
const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

module.exports = async (context) => {
  await ownerMiddleware(context, async () => {
    const { m, args } = context;
    const value = args[0]?.toLowerCase();
    const jid = m.chat;

    if (!jid.endsWith('@g.us')) {
      return await m.reply(
        `╭───(    TOXIC-MD    )───\n` +
        `├───≫ ANTIDEMOTE ≪───\n` +
        `├ \n` +
        `├ Epic fail, loser!\n` +
        `├ This command is for groups only, moron!\n` +
        `╰──────────────────☉\n` +
        `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
      );
    }

    const settings = await getSettings();
    const prefix = settings.prefix;

    let groupSettings = await getGroupSetting(jid);
    let isEnabled = groupSettings?.antidemote === true;

    if (value === 'on' || value === 'off') {
      const action = value === 'on';

      if (isEnabled === action) {
        return await m.reply(
          `╭───(    TOXIC-MD    )───\n` +
          `├───≫ ANTIDEMOTE ≪───\n` +
          `├ \n` +
          `├ Antidemote is already ${value.toUpperCase()}, you brainless fool!\n` +
          `├ Quit wasting my time!\n` +
          `╰──────────────────☉\n` +
          `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        );
      }

      await updateGroupSetting(jid, 'antidemote', action ? 'true' : 'false');
      await m.reply(
        `╭───(    TOXIC-MD    )───\n` +
        `├───≫ ANTIDEMOTE ≪───\n` +
        `├ \n` +
        `├ Antidemote ${value.toUpperCase()}!\n` +
        `├ Demotions are under my watch, king!\n` +
        `╰──────────────────☉\n` +
        `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
      );
    } else {
      await m.reply(
        `╭───(    TOXIC-MD    )───\n` +
        `├───≫ ANTIDEMOTE ≪───\n` +
        `├ \n` +
        `├ Antidemote Status: ${isEnabled ? 'ON' : 'OFF'}\n` +
        `├ Use "${prefix}antidemote on" or "${prefix}antidemote off", peasant!\n` +
        `╰──────────────────☉\n` +
        `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
      );
    }
  });
};
