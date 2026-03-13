const { botname } = require('../../config/settings');

module.exports = {
  name: 'listonline',
  aliases: ['online', 'active', 'onlineusers', 'whoonline', 'whos-online'],
  description: 'List currently online group members by subscribing to presence updates',
  run: async (context) => {
    const { client, m } = context;
    const bName = botname || 'Toxic-MD';

    if (!m.isGroup) {
      return client.sendMessage(m.chat, {
        text: `╭───(    TOXIC-MD    )───\n├───≫ GROUP COMMAND ≪───\n├ \n├ This ain't a group, genius.\n├ Use this in a group chat.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
      }, { quoted: m });
    }

    try {
      await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

      const groupMetadata = await client.groupMetadata(m.chat);
      const participants = groupMetadata.participants || [];
      const groupName = groupMetadata.subject || 'Unknown Group';

      const presenceResults = {};

      const presenceHandler = (json) => {
        const chatId = Object.keys(json)[0];
        if (chatId === m.chat) {
          const presences = json[chatId]?.presences || json[chatId];
          if (presences && typeof presences === 'object') {
            for (const [jid, data] of Object.entries(presences)) {
              if (jid.includes('@')) {
                const status = data?.lastKnownPresence || data;
                if (status === 'available' || status === 'composing' || status === 'recording') {
                  presenceResults[jid] = status;
                }
              }
            }
          }
        }
      };

      client.ev.on('presence.update', presenceHandler);

      try {
        await client.presenceSubscribe(m.chat);
      } catch (e) {}

      await new Promise(resolve => setTimeout(resolve, 3000));

      client.ev.off('presence.update', presenceHandler);

      const onlineJids = Object.keys(presenceResults);

      if (onlineJids.length === 0) {
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return client.sendMessage(m.chat, {
          text: `╭───(    TOXIC-MD    )───\n├───≫ NO ONE ONLINE ≪───\n├ \n├ Group: ${groupName}\n├ Either everyone's hiding or\n├ they all have privacy on.\n├ Cowards, the lot of them.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        }, { quoted: m });
      }

      const onlineList = onlineJids
        .map((jid, index) => `├ ${index + 1}. @${jid.split('@')[0]}`)
        .join('\n');

      await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

      await client.sendMessage(m.chat, {
        text: `╭───(    TOXIC-MD    )───\n├───≫ ONLINE MEMBERS ≪───\n├ \n├ Group: ${groupName}\n├ Online: ${onlineJids.length}/${participants.length}\n├ \n${onlineList}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
        mentions: onlineJids
      }, { quoted: m });

    } catch (error) {
      await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
      await client.sendMessage(m.chat, {
        text: `╭───(    TOXIC-MD    )───\n├───≫ FAILED ≪───\n├ \n├ Couldn't fetch online users.\n├ Error: ${error.message || 'Unknown'}\n├ Try again, or don't. I don't care.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
      }, { quoted: m });
    }
  }
};
