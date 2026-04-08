const { getSettings, updateSetting } = require('../../database/config');
const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

module.exports = async (context) => {
  await ownerMiddleware(context, async () => {
    const { client, m, args, prefix } = context;

    const formatStylishReply = (message) => {
      return `╭───(    TOXIC-MD    )───\n├ ${message}\n╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
    };

    try {
      const settings = await getSettings();
      if (!settings || Object.keys(settings).length === 0) {
        return await client.sendMessage(
          m.chat,
          { text: formatStylishReply("Database is fucked, no settings found. Fix it, loser.") },
          { quoted: m, ad: true }
        );
      }

      const value = args.join(" ").toLowerCase();
      const validModes = ['public', 'private'];

      if (validModes.includes(value)) {
        if (settings.mode === value) {
          return await client.sendMessage(
            m.chat,
            { text: formatStylishReply(`Yo, moron! 😈 Bot is already in ${value.toUpperCase()} mode! Stop wasting my time, peasant! 🖕`) },
            { quoted: m, ad: true }
          );
        }

        await updateSetting('mode', value);
        await client.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } });
        return await client.sendMessage(
          m.chat,
          { text: formatStylishReply(`Bot mode set to ${value.toUpperCase()}! 🔥 Bow to the king, I rule now! 😈`) },
          { quoted: m, ad: true }
        );
      }

      const buttons = [
        { buttonId: `${prefix}mode public`, buttonText: { displayText: "PUBLIC 🌐" }, type: 1 },
        { buttonId: `${prefix}mode private`, buttonText: { displayText: "PRIVATE 🔒" }, type: 1 },
      ];

      await client.sendMessage(
        m.chat,
        {
          text: formatStylishReply(`Current Mode: ${settings.mode ? settings.mode.toUpperCase() : 'Undefined, you noob! 🥶'}. Pick a mode, fool! 😈`),
          buttons,
          headerType: 1,
          viewOnce: true,
        },
        { quoted: m, ad: true }
      );
    } catch (error) {
      await client.sendMessage(
        m.chat,
        { text: formatStylishReply("Shit broke, couldn’t update mode. Database or something’s fucked. Try later.") },
        { quoted: m, ad: true }
      );
    }
  });
};