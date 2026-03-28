const middleware = require('../../utils/botUtil/middleware');

module.exports = {
  name: 'promote',
  aliases: ['makeadmin', 'addadmin', 'promoteuser'],
  description: 'Promotes a user to admin in a group',
  run: async (context) => {
    await middleware(context, async () => {
      const { client, m, prefix } = context;

      const normalizeJid = (jid) => {
        if (!jid) return '';
        return jid.split('@')[0].split(':')[0].replace(/\D/g, '') + '@s.whatsapp.net';
      };

      const groupMetadata = await client.groupMetadata(m.chat);
      const participants = groupMetadata.participants;

      let users = null;
      if (m.mentionedJid && m.mentionedJid.length > 0) users = m.mentionedJid[0];
      if (!users && m.quoted?.sender) users = m.quoted.sender;

      if (!users) {
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ USAGE ≪───\n├ \n├ Mention or quote a user.\n├ Example: ${prefix}promote @user\n├ Do I have to spell everything?\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }

      const targetJid = normalizeJid(users);
      if (!targetJid) return m.reply(`╭───(    TOXIC-MD    )───\n├ Invalid user.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

      const realMember = participants.find(p => normalizeJid(p.jid || p.id) === targetJid);
      const actualJid = realMember ? normalizeJid(realMember.jid || realMember.id) : targetJid;

      try {
        await client.groupParticipantsUpdate(m.chat, [actualJid], 'promote');
        await client.sendMessage(m.chat, {
          text: `╭───(    TOXIC-MD    )───\n├───≫ PROMOTED ≪───\n├ \n├ @${actualJid.split('@')[0]} is now an admin.\n├ Don't let the power go to\n├ your empty head.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
          mentions: [actualJid]
        }, { quoted: m });
      } catch (error) {
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Failed to promote: ${error.message?.slice(0,60)}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }
    });
  }
};
