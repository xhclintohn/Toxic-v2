const middleware = require('../../utils/botUtil/middleware');

module.exports = {
  name: 'demote',
  aliases: ['unadmin', 'removeadmin', 'deadmin', 'demoteuser'],
  description: 'Demotes a user from admin in a group',
  run: async (context) => {
    await middleware(context, async () => {
      const { client, m, prefix, isBotAdmin } = context;

      const normalizeJid = (jid) => {
        if (!jid) return '';
        return jid.split('@')[0].split(':')[0].replace(/\D/g, '') + '@s.whatsapp.net';
      };

      if (!isBotAdmin) return m.reply(`╭───(    TOXIC-MD    )───\n├ I'm not admin here.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

      let user = null;
      if (m.mentionedJid && m.mentionedJid.length > 0) user = m.mentionedJid[0];
      if (!user && m.quoted?.sender) user = m.quoted.sender;

      if (!user) return m.reply(`╭───(    TOXIC-MD    )───\n├ Mention or quote a user. ${prefix}demote @user\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

      const groupMetadata = await client.groupMetadata(m.chat);
      const participants = groupMetadata.participants;
      const targetJid = normalizeJid(user);
      const realMember = participants.find(p => normalizeJid(p.jid || p.id) === targetJid);
      const actualJid = realMember ? normalizeJid(realMember.jid || realMember.id) : targetJid;

      try {
        await client.groupParticipantsUpdate(m.chat, [actualJid], 'demote');
        await client.sendMessage(m.chat, {
          text: `╭───(    TOXIC-MD    )───\n├───≫ DEMOTED ≪───\n├ \n├ @${actualJid.split('@')[0]} got stripped of admin.\n├ Back to being a nobody.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
          mentions: [actualJid]
        }, { quoted: m });
      } catch (error) {
        await m.reply(`╭───(    TOXIC-MD    )───\n├ Demote failed: ${error.message?.slice(0,60)}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }
    });
  },
};
