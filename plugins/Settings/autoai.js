const { getSettings, updateSetting } = require('../../database/config');
const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

module.exports = {
  name: 'autoai',
  aliases: ['groqai', 'aibot', 'autogpt'],
  description: 'Toggle Auto AI (Groq) replies in DMs and when tagged in groups',
  run: async (context) => {
    await ownerMiddleware(context, async () => {
      const { client, m, args, prefix } = context;

      const fmt = (title, message) => `╭───(    TOXIC-MD    )───\n├───≫ ${title} ≪───\n├ \n├ ${message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

      try {
        const settings = await getSettings();
        if (!settings || Object.keys(settings).length === 0) {
          return await client.sendMessage(m.chat, { text: fmt('AUTO AI', 'Database is down. Fix it.') }, { quoted: m });
        }

        const value = args[0]?.toLowerCase();

        if (value === 'on' || value === 'off') {
          const newState = value === 'on';
          if (settings.autoai === newState) {
            return await client.sendMessage(m.chat, { text: fmt('AUTO AI', `Auto AI is already ${value.toUpperCase()}, genius.`) }, { quoted: m });
          }
          await updateSetting('autoai', newState);
          await client.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } });
          return await client.sendMessage(m.chat, {
            text: fmt('AUTO AI', `Auto AI ${value.toUpperCase()}! ${newState ? 'I\'ll answer everyone now. God help them.' : 'Shutting up. Finally some peace.'}`)
          }, { quoted: m });
        }

        return await client.sendMessage(m.chat, {
          text: fmt('AUTO AI', `Auto AI Status: ${settings.autoai ? 'ON (Responding to DMs + @mentions)' : 'OFF (Silent mode, loser)'}\n├ \n├ GROQ_API_KEY is set via environment variable.\n├ Get key: console.groq.com\n├ \n├ Usage: ${prefix}autoai on/off`)
        }, { quoted: m });

      } catch {
        await client.sendMessage(m.chat, { text: fmt('AUTO AI', 'Something broke. Try again later.') }, { quoted: m });
      }
    });
  }
};
