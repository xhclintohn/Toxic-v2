const { getFakeQuoted } = require('../../lib/fakeQuoted');
module.exports = async (context) => {
    const { client, m, text, pict } = context;
    const fq = getFakeQuoted(m);

    try {
        let targetUser = m.sender;
        let displayName = null;

        if (m.quoted) {
            targetUser = m.quoted.sender;
        } else if (text) {
            if (text.includes('@')) {
                const mentionedJid = m.mentionedJid && m.mentionedJid[0];
                if (mentionedJid) {
                    targetUser = mentionedJid;
                }
            } else {
                const cleanedNumber = text.replace(/\s+/g, '').replace(/[^\d+]/g, '');
                
                if (/^\+?\d{10,15}$/.test(cleanedNumber)) {
                    let formattedNumber = cleanedNumber;
                    if (formattedNumber.startsWith('+')) {
                        formattedNumber = formattedNumber.substring(1);
                    }
                    if (!formattedNumber.endsWith('@s.whatsapp.net')) {
                        targetUser = formattedNumber.includes('@') ? 
                            formattedNumber : 
                            `${formattedNumber}@s.whatsapp.net`;
                    }
                }
            }
        }

        try {
            const profileName = await client.getName(targetUser);
            displayName = profileName || targetUser.split('@')[0];
        } catch {
            displayName = targetUser.split('@')[0];
        }

        let ppUrl = pict;
        try {
            ppUrl = await client.profilePictureUrl(targetUser, 'image');
        } catch {
            ppUrl = pict;
        }

        await client.sendMessage(m.chat, {
            image: { url: ppUrl },
            caption: `╭───(    TOXIC-MD    )───\n├───≫ Pʀᴏꜰɪʟᴇ ≪───\n├ \n├ ${displayName}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
            mentions: targetUser !== m.sender ? [targetUser] : []
        }, { quoted: fq });

    } catch (error) {
        console.error('Profile error:', error);
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Failed to fetch profile.\n├ The user probably blocked you or\n├ their privacy settings are stricter\n├ than your intelligence.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};