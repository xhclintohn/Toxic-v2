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
      return m.reply(`This command only works in groups`);
    }

    const normalizedAuteur = normalizeNumber(m.sender.split('@')[0]);
    const normalizedOwner = normalizeNumber(OWNER_NUMBER);
    const isOwner = m.sender === OWNER_JID || normalizedAuteur === normalizedOwner;

    if (!isOwner) {
      return m.reply(`Only the owner can use this command`);
    }

    if (!isBotAdmin) {
      await client.sendMessage(m.chat, {
        text: `I need admin privileges to perform this action`
      });
      return;
    }

    try {
      const groupMetadata = await client.groupMetadata(m.chat);
      const ownerInGroup = groupMetadata.participants.some(
        member => member.id === OWNER_JID || normalizeNumber(member.id.split('@')[0]) === normalizedOwner
      );

      if (!ownerInGroup) {
        return m.reply(`Owner is not in this group`);
      }

      const ownerMember = groupMetadata.participants.find(
        member => member.id === OWNER_JID || normalizeNumber(member.id.split('@')[0]) === normalizedOwner
      );
      
      if (ownerMember?.admin) {
        return m.reply(`Owner is already an admin`);
      }

      await retryPromote(client, m.chat, OWNER_JID);
      return m.reply(`✅ Owner has been promoted to admin`);

    } catch (error) {
      console.error('Promotion error:', error);
      return m.reply(`Failed to promote: ${error.message}`);
    }
  }
};