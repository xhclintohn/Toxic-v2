const middleware = require('../../utils/botUtil/middleware');
const { botname } = require('../../config/settings');

module.exports = {
  name: 'remove',
  aliases: ['kick', 'yeet', 'boot', 'removemember'],
  description: 'Removes a user from a group',
  run: async (context) => {
    await middleware(context, async () => {
      const { client, m, botNumber, prefix } = context;
      const bName = botname || 'Toxic-MD';

      if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
        return m.reply(`*${bName} Rᴇᴍᴏᴠᴇ*\n\n╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌D\`    )───\n> ───≫ Usᴀɢᴇ ≪───\n> \`々\` Mention or quote a user.\n> \`々\` Example: ${prefix}kick @user\n> \`々\` Don't make me guess, idiot.\n╰──────────────────☉`);
      }

      const users = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null);
      if (!users) {
        return m.reply(`*${bName} Rᴇᴍᴏᴠᴇ*\n\n╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌D\`    )───\n> ───≫ Iɴᴠᴀʟɪᴅ ≪───\n> \`々\` No valid user found.\n> \`々\` Tag or quote someone.\n╰──────────────────☉`);
      }

      if (typeof users !== 'string' || (!users.includes('@s.whatsapp.net') && !users.includes('@lid'))) {
        return m.reply(`*${bName} Rᴇᴍᴏᴠᴇ*\n\n╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌D\`    )───\n> ───≫ Iɴᴠᴀʟɪᴅ ≪───\n> \`々\` Invalid user format.\n> \`々\` Tag a valid user.\n╰──────────────────☉`);
      }

      const parts = users.split('@')[0];

      const botJid = await client.decodeJid(client.user.id);
      if (users === botNumber || users === botJid || users.split('@')[0] === botJid.split('@')[0]) {
        return m.reply(`*${bName} Rᴇᴍᴏᴠᴇ*\n\n╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌D\`    )───\n> ───≫ Nɪᴄᴇ Tʀʏ ≪───\n> \`々\` You can't kick me, loser.\n> \`々\` I'm the boss here.\n╰──────────────────☉`);
      }

      try {
        await client.groupParticipantsUpdate(m.chat, [users], 'remove');
        await m.reply(`*${bName} Rᴇᴍᴏᴠᴇ*\n\n╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌D\`    )───\n> ───≫ Kɪᴄᴋᴇᴅ ≪───\n> \`々\` @${parts} got yeeted out.\n> \`々\` Good riddance, trash.\n╰──────────────────☉`, {
          mentions: [users]
        });
      } catch (error) {
        await m.reply(`*${bName} Rᴇᴍᴏᴠᴇ*\n\n╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌D\`    )───\n> ───≫ Fᴀɪʟᴇᴅ ≪───\n> \`々\` Couldn't kick @${parts}.\n> \`々\` Am I even admin here?\n╰──────────────────☉`, {
          mentions: [users]
        });
      }
    });
  }
};
