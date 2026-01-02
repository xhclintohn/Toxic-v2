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

      let url;
      try {
        url = new URL(link);
      } catch {
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return m.reply("That's not even a valid URL. Are you trying to break my code on purpose?");
      }

      if (url.hostname === 'chat.whatsapp.com') {
        const code = url.pathname.replace(/^\/+/, '');
        
        if (!code || code.length < 5) {
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
          return m.reply("Invalid group invite code. The link looks fake as fuck.");
        }

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        
        const message = {
          text: `*Group Link Analysis*\n\n🔗 *Link:* ${link}\n📌 *Invite Code:* \`${code}\`\n\n*How to get the actual Group ID:*\n1. Join the group first (I can't magically get IDs from outside)\n2. Once you're in, use ${prefix}groupinfo to get all details`,
          templateButtons: [
            {
              index: 1,
              ctaCopyButton: {
                displayText: "📋 Copy Invite Code",
                copyCode: code
              }
            }
          ]
        };
        
        await client.sendMessage(m.chat, message, { quoted: m });

      } 
      else if (url.hostname === 'whatsapp.com' && url.pathname.startsWith('/channel/')) {
        const channelCode = url.pathname.split('/channel/')[1]?.split('/')[0];
        
        if (!channelCode) {
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
          return m.reply("Invalid channel link. Did you copy it right, or are you just making shit up?");
        }

        const channelId = `newsletter@${channelCode}`;
        
        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        
        const message = {
          text: `*Channel Link Analysis*\n\n🔗 *Link:* ${link}\n📌 *Channel Code:* \`${channelCode}\`\n\n*Channel ID:* \`${channelId}\``,
          templateButtons: [
            {
              index: 1,
              ctaCopyButton: {
                displayText: "📋 Copy Channel ID",
                copyCode: channelId
              }
            },
            {
              index: 2,
              ctaCopyButton: {
                displayText: "📋 Copy Channel Code",
                copyCode: channelCode
              }
            }
          ]
        };
        
        await client.sendMessage(m.chat, message, { quoted: m });

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