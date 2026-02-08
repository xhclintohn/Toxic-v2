const middleware = require('../../utils/botUtil/middleware');
const { botname } = require('../../config/settings');

module.exports = {
  name: 'demote',
  aliases: ['unadmin', 'removeadmin', 'deadmin', 'demoteuser'],
  description: 'Demotes a user from admin in a group',
  run: async (context) => {
    await middleware(context, async () => {
      const { client, m, prefix } = context;
      const bName = botname || 'Toxic-MD';

      let groupMetadata;
      try {
        groupMetadata = await client.groupMetadata(m.chat);
      } catch (e) {
        return m.reply(`*${bName} Eʀʀᴏʀ*\n\n╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌D\`    )───\n> ───≫ Fᴀɪʟᴇᴅ ≪───\n> \`々\` Can't fetch group data.\n> \`々\` Error: ${e.message}\n╰──────────────────☉`);
      }

      const members = groupMetadata.participants;
      const botJid = await client.decodeJid(client.user.id);

      const isUserAdmin = (targetJid) => {
        return members.some(p => {
          if (!p.admin) return false;
          const pJid = p.id;
          if (pJid === targetJid) return true;
          if (pJid.split('@')[0] === targetJid.split('@')[0]) return true;
          return false;
        });
      };

      const isBotAdminCheck = members.some(p => {
        if (!p.admin) return false;
        const pId = p.id;
        if (pId === botJid) return true;
        if (pId.split('@')[0] === botJid.split('@')[0]) return true;
        return false;
      });

      if (!isBotAdminCheck) {
        return m.reply(`*${bName} Dᴇᴍᴏᴛᴇ*\n\n╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌D\`    )───\n> ───≫ Nᴏᴛ Aᴅᴍɪɴ ≪───\n> \`々\` I'm not admin here, fool.\n> \`々\` Make me admin first, then\n> \`々\` come crawling back.\n╰──────────────────☉`);
      }

      if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
        return m.reply(`*${bName} Dᴇᴍᴏᴛᴇ*\n\n╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌D\`    )───\n> ───≫ Usᴀɢᴇ ≪───\n> \`々\` Mention or quote a user.\n> \`々\` Example: ${prefix}demote @user\n> \`々\` Don't waste my time.\n╰──────────────────☉`);
      }

      const user = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null);
      if (!user) {
        return m.reply(`*${bName} Dᴇᴍᴏᴛᴇ*\n\n╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌D\`    )───\n> ───≫ Iɴᴠᴀʟɪᴅ ≪───\n> \`々\` Invalid user specified.\n> \`々\` Tag someone properly.\n╰──────────────────☉`);
      }

      const userNumber = user.split('@')[0];

      if (!isUserAdmin(user)) {
        return m.reply(`*${bName} Dᴇᴍᴏᴛᴇ*\n\n╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌D\`    )───\n> ───≫ Nᴏᴛ Aᴅᴍɪɴ ≪───\n> \`々\` @${userNumber} isn't even admin.\n> \`々\` Can't demote a peasant.\n╰──────────────────☉`, {
          mentions: [user]
        });
      }

      try {
        await client.groupParticipantsUpdate(m.chat, [user], 'demote');
        await m.reply(`*${bName} Dᴇᴍᴏᴛᴇ*\n\n╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌D\`    )───\n> ───≫ Dᴇᴍᴏᴛᴇᴅ ≪───\n> \`々\` @${userNumber} got stripped of admin.\n> \`々\` Back to being a nobody.\n╰──────────────────☉`, {
          mentions: [user]
        });
      } catch (error) {
        await m.reply(`*${bName} Dᴇᴍᴏᴛᴇ*\n\n╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌D\`    )───\n> ───≫ Fᴀɪʟᴇᴅ ≪───\n> \`々\` Couldn't demote that user.\n> \`々\` Error: ${error.message}\n╰──────────────────☉`);
      }
    });
  },
};
