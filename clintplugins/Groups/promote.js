const middleware = require('../../utility/botUtil/middleware');
const { botname } = require('../../Env/settings');

module.exports = {
  name: 'promote',
  aliases: ['makeadmin', 'addadmin', 'promoteuser'],
  description: 'Promotes a user to admin in a group',
  run: async (context) => {
    await middleware(context, async () => {
      const { client, m, prefix } = context;
      const bName = botname || 'Toxic-MD';

      if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
        return m.reply(`*${bName} Pʀᴏᴍᴏᴛᴇ*\n\n╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌D\`    )───\n> ───≫ Usᴀɢᴇ ≪───\n> \`々\` Mention or quote a user.\n> \`々\` Example: ${prefix}promote @user\n> \`々\` Do I have to spell everything?\n╰──────────────────☉`);
      }

      const users = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null);
      if (!users) {
        return m.reply(`*${bName} Pʀᴏᴍᴏᴛᴇ*\n\n╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌D\`    )───\n> ───≫ Iɴᴠᴀʟɪᴅ ≪───\n> \`々\` Invalid user specified.\n> \`々\` Tag someone properly, fool.\n╰──────────────────☉`);
      }

      const parts = users.split('@')[0];

      try {
        await client.groupParticipantsUpdate(m.chat, [users], 'promote');
        await m.reply(`*${bName} Pʀᴏᴍᴏᴛᴇ*\n\n╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌D\`    )───\n> ───≫ Pʀᴏᴍᴏᴛᴇᴅ ≪───\n> \`々\` @${parts} is now an admin.\n> \`々\` Don't let the power go to\n> \`々\` your empty head.\n╰──────────────────☉`, {
          mentions: [users]
        });
      } catch (error) {
        await m.reply(`*${bName} Pʀᴏᴍᴏᴛᴇ*\n\n╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌D\`    )───\n> ───≫ Fᴀɪʟᴇᴅ ≪───\n> \`々\` Couldn't promote that user.\n> \`々\` Error: ${error.message}\n╰──────────────────☉`);
      }
    });
  }
};
