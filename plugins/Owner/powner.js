const OWNER_NUMBER = "254735342808";
const OWNER_JID = `${OWNER_NUMBER}@s.whatsapp.net`;

const normalizeNumber = (number) => {
  return number.replace(/[^0-9]/g, '').replace(/^0+/, '').replace(/^\+254/, '254') || number;
};

const retryPromote = async (client, groupId, participant, maxRetries = 5, baseDelay = 1500) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await client.groupParticipantsUpdate(groupId, [participant], "promote");
      return true;
    } catch (e) {
      if (attempt === maxRetries) throw e;
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

module.exports = {
  name: 'powner',
  aliases: ['promoteowner', 'makeowneradmin'],
  description: 'Promotes the owner to admin',
  run: async (context) => {
    const { client, m, isBotAdmin, isAdmin } = context;

    if (!m.isGroup) {
      return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ This command only works in groups.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }

    const normalizedAuteur = normalizeNumber(m.sender.split('@')[0]);
    const normalizedOwner = normalizeNumber(OWNER_NUMBER);
    const isOwner = m.sender === OWNER_JID || normalizedAuteur === normalizedOwner;

    if (!isOwner) {
      return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ Only the owner can use this command.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }

    if (!isBotAdmin) {
      await client.sendMessage(m.chat, {
        text: `╭───(    TOXIC-MD    )───\n├ \n├ I need admin privileges to\n├ perform this action.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
      });
      return;
    }

    try {
      const groupMetadata = await client.groupMetadata(m.chat);
      const ownerInGroup = groupMetadata.participants.some(
        member => member.id === OWNER_JID || normalizeNumber(member.id.split('@')[0]) === normalizedOwner
      );

      if (!ownerInGroup) {
        return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ Owner is not in this group.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }

      const ownerMember = groupMetadata.participants.find(
        member => member.id === OWNER_JID || normalizeNumber(member.id.split('@')[0]) === normalizedOwner
      );
      
      if (ownerMember?.admin) {
        return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ Owner is already an admin.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }

      await retryPromote(client, m.chat, OWNER_JID);
      return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ PROMOTED ≪───\n├ \n├ Owner has been promoted to admin.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

    } catch (error) {
      console.error('Promotion error:', error);
      return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Failed to promote: ${error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
  }
};
