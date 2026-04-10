const { getSettings, updateSetting } = require('../../database/config');
const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

module.exports = {
  name: 'autoai',
  aliases: ['groqai', 'aibot', 'autogpt'],
  description: 'Toggle Auto AI replies in DMs and when tagged in groups',
  run: async (context) => {
    await ownerMiddleware(context, async () => {
      const { client, m, args, prefix } = context;

      const fmt = (title, lines) => {
        const body = (Array.isArray(lines) ? lines : [lines]).map(l => `├ ${l}`).join('\n');
        return `╭───(    TOXIC-MD    )───\n├───≫ ${title} ≪───\n├\n${body}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
      };

      try {
        const settings = await getSettings();
        const value = (args[0] || '').toLowerCase();

        if (value === 'on' || value === 'off') {
          const newState = value === 'on';
          if (settings.autoai === newState) {
            return client.sendMessage(m.chat, { text: fmt('AUTO AI', `already ${value.toUpperCase()} 🙄 stop pressing buttons`) }, { quoted: m });
          }
          await updateSetting('autoai', newState);
          await client.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } });
          return client.sendMessage(m.chat, {
            text: fmt('AUTO AI', newState
              ? ['Status: ✅ ON', 'Replying to DMs + @mentions in groups.', 'God help them 😒']
              : ['Status: ❌ OFF', 'Silent mode. Finally.'])
          }, { quoted: m });
        }

        const isOn = settings.autoai === true || settings.autoai === 'true';
        return client.sendMessage(m.chat, {
          text: fmt('AUTO AI', [
            `Status: ${isOn ? '✅ ON' : '❌ OFF'}`,
            `Triggers: DMs · @mentions · replies to bot · prefix msgs`,
            '',
            `Toggle: ${prefix}autoai on  /  ${prefix}autoai off`
          ])
        }, { quoted: m });

      } catch {
        client.sendMessage(m.chat, { text: fmt('AUTO AI', 'something broke. try again.') }, { quoted: m });
      }
    });
  }
};
