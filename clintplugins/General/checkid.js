module.exports = {
  name: 'checkid',
  aliases: ['cekid', 'getid', 'id'],
  description: 'Get the JID of a WhatsApp group or channel from its invite link',
  run: async (context) => {
    const { client, m, prefix } = context;

    try {
      const text = m.body.trim();
      const linkMatch = text.match(/https?:\/\/(chat\.whatsapp\.com|whatsapp\.com\/channel)\/[^\s]+/i);
      const link = linkMatch ? linkMatch[0] : null;

      if (!link) {
        return m.reply(`Where's the link, you brainless ape?\nExample: ${prefix}checkid https://chat.whatsapp.com/xxxxx`);
      }

      await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

      if (link.includes("https://whatsapp.com/channel/")) {
        const channelCode = link.split("https://whatsapp.com/channel/")[1];
        
        if (!channelCode) {
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
          return m.reply("Invalid channel link. Did you copy it right, or are you just making shit up?");
        }

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        
        const channelId = `${channelCode.trim()}@newsletter`;
        
        await client.sendMessage(m.chat, {
          interactiveMessage: {
            header: `📢 *Channel Link Analysis*\n\n🔗 *Link:* ${link}\n📌 *Channel Code:* \`${channelCode}\`\n\n*Channel ID:* \`${channelId}\``,
            footer: "Powered by Toxic-MD",
            buttons: [
              {
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({
                  display_text: "📋 Copy Channel ID",
                  copy_code: channelId
                })
              }
            ]
          }
        }, { quoted: m });

      }
      else if (link.includes("chat.whatsapp.com")) {
        const code = link.split("chat.whatsapp.com/")[1]?.split(/[?\/]/)[0];
        
        if (!code || code.length < 5) {
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
          return m.reply("Invalid group invite code. The link looks fake as fuck.");
        }

        const groupId = `${code}@g.us`;
        
        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        
        await client.sendMessage(m.chat, {
          interactiveMessage: {
            header: `📊 *Group Link Analysis*\n\n🔗 *Link:* ${link}\n📌 *Invite Code:* \`${code}\`\n\n*Group ID:* \`${groupId}\`\n\n*Note:* This is the ID format. Actual ID may differ until you join.`,
            footer: "Powered by Toxic-MD",
            buttons: [
              {
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({
                  display_text: "📋 Copy Group ID",
                  copy_code: groupId
                })
              }
            ]
          }
        }, { quoted: m });

      }
      else {
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return m.reply("That's not a WhatsApp group or channel link. Are you blind or just stupid?");
      }

    } catch (error) {
      console.error('CheckID command error:', error);
      await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
      await m.reply(`CheckID command crashed.\nError: ${error.message}\nThe link is probably fake or expired.`);
    }
  }
};