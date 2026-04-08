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
          { text: formatStylishReply("Database is down, no settings found. Fix it!") },
          { quoted: m, ad: true }
        );
      }

      const value = args.join(" ").toLowerCase();
      const validValues = ['on', 'off'];

      if (!validValues.includes(value)) {
        const buttons = [
          { buttonId: `${prefix}chatbotpm on`, buttonText: { displayText: "ENABLE CHATBOT 🤖" }, type: 1 },
          { buttonId: `${prefix}chatbotpm off`, buttonText: { displayText: "DISABLE CHATBOT 🔴" }, type: 1 },
        ];

        return await client.sendMessage(
          m.chat,
          {
            text: formatStylishReply(`Chatbot PM is currently ${settings.chatbotpm ? 'ENABLED' : 'DISABLED'}. Use ${prefix}chatbotpm on/off to toggle.`),
            buttons,
            headerType: 1,
            viewOnce: true,
          },
          { quoted: m, ad: true }
        );
      }

      const newState = value === 'on';
      if (settings.chatbotpm === newState) {
        return await client.sendMessage(
          m.chat,
          { text: formatStylishReply(`Chatbot PM is already ${newState ? 'ENABLED' : 'DISABLED'}! Stop spamming, fool! 😈`) },
          { quoted: m, ad: true }
        );
      }

      await updateSetting('chatbotpm', newState);
      await client.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } });
      return await client.sendMessage(
        m.chat,
        { text: formatStylishReply(`Chatbot PM ${newState ? 'ENABLED' : 'DISABLED'}! ${newState ? 'Now I’ll chat like a pro! 🤖' : 'Back to normal, boring mode. 😴'}`) },
        { quoted: m, ad: true }
      );
    } catch (error) {
      console.error('Error toggling chatbotpm:', error);
      await client.sendMessage(
        m.chat,
        { text: formatStylishReply("Something broke while toggling Chatbot PM. Try again later.") },
        { quoted: m, ad: true }
      );
    }
  });
};