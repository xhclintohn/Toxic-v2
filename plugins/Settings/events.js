const { getSettings, getGroupSettings, updateGroupSetting } = require('../../database/config');
const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

module.exports = async (context) => {
  await ownerMiddleware(context, async () => {
    const { client, m, args, prefix } = context;
    const jid = m.chat;

    const formatStylishReply = (message) => {
      return `╭───(    TOXIC-MD    )───\n├ ${message}\n╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
    };

    try {
      if (!jid.endsWith('@g.us')) {
        return await client.sendMessage(
          m.chat,
          { text: formatStylishReply("Yo, dumbass! 😈 This command only works in groups, not your sad DMs. 🖕") },
          { quoted: m, ad: true }
        );
      }

      const settings = await getSettings();
      if (!settings || Object.keys(settings).length === 0) {
        return await client.sendMessage(
          m.chat,
          { text: formatStylishReply("Database is fucked, no settings found. Fix it, loser. 💀") },
          { quoted: m, ad: true }
        );
      }

      const value = args[0]?.toLowerCase();
      let groupSettings = await getGroupSettings(jid);
      console.log('Toxic-MD: Group settings for', jid, ':', groupSettings);
      let isEnabled = groupSettings?.events === true || groupSettings?.events === 'true';

      if (value === 'on' || value === 'off') {
        const action = value === 'on';
        if (isEnabled === action) {
          return await client.sendMessage(
            m.chat,
            {
              text: formatStylishReply(
                `Yo, genius! 😈 Events are already ${value.toUpperCase()} in this group! Stop wasting my time, moron. 🖕`
              ),
            },
            { quoted: m, ad: true }
          );
        }

        await updateGroupSetting(jid, 'events', action);
        return await client.sendMessage(
          m.chat,
          {
            text: formatStylishReply(
              `Events ${value.toUpperCase()}! 🔥 ${action ? 'Group events are live, let’s make some chaos! 💥' : 'Events off, you boring loser. 😴'}`
            ),
          },
          { quoted: m, ad: true }
        );
      }

      const buttons = [
        { buttonId: `${prefix}events on`, buttonText: { displayText: 'ON 🥶' }, type: 1 },
        { buttonId: `${prefix}events off`, buttonText: { displayText: 'OFF 😴' }, type: 1 },
      ];

      await client.sendMessage(
        m.chat,
        {
          text: formatStylishReply(
            `Events Status: ${isEnabled ? 'ON 🥶' : 'OFF 😴'}. Pick a vibe, noob! 😈`
          ),
          footer: '> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧',
          buttons,
          headerType: 1,
          viewOnce: true,
        },
        { quoted: m, ad: true }
      );
    } catch (error) {
      console.error('Toxic-MD: Error in events.js:', error.stack);
      await client.sendMessage(
        m.chat,
        {
          text: formatStylishReply(
            `Shit broke, couldn’t update events. Database error: ${error.message}. Try later, moron. 💀`
          ),
        },
        { quoted: m, ad: true }
      );
    }
  });
};