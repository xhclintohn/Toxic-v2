const { getSettings, getGroupSetting, updateGroupSetting } = require('../../database/config');
const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, args } = context;
        const value = args[0]?.toLowerCase();
        const jid = m.chat;

        if (!jid.endsWith('@g.us')) {
            return await m.reply(
                `╭───(    TOXIC-MD    )───\n` +
                `├───≫ ANTITAG ≪───\n` +
                `├ \n` +
                `├ This command can only be used in groups, fool!\n` +
                `╰──────────────────☉\n` +
                `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            );
        }

        const settings = await getSettings();
        const prefix = settings.prefix;

        let groupSettings = await getGroupSetting(jid);
        let isEnabled = groupSettings?.antitag === true;

        const Myself = await client.decodeJid(client.user.id);
        const groupMetadata = await client.groupMetadata(m.chat);
        const userAdmins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id);
        const isBotAdmin = userAdmins.includes(Myself);

        if (value === 'on' && !isBotAdmin) {
            return await m.reply(
                `╭───(    TOXIC-MD    )───\n` +
                `├───≫ ANTITAG ≪───\n` +
                `├ \n` +
                `├ I need admin privileges to enable Antitag, you clown!\n` +
                `╰──────────────────☉\n` +
                `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            );
        }

        if (value === 'on' || value === 'off') {
            const action = value === 'on';

            if (isEnabled === action) {
                return await m.reply(
                    `╭───(    TOXIC-MD    )───\n` +
                    `├───≫ ANTITAG ≪───\n` +
                    `├ \n` +
                    `├ Antitag is already ${value.toUpperCase()}, genius!\n` +
                    `╰──────────────────☉\n` +
                    `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
                );
            }

            await updateGroupSetting(jid, 'antitag', action ? 'true' : 'false');
            await m.reply(
                `╭───(    TOXIC-MD    )───\n` +
                `├───≫ ANTITAG ≪───\n` +
                `├ \n` +
                `├ Antitag has been turned ${value.toUpperCase()} for this group.\n` +
                `╰──────────────────☉\n` +
                `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            );
        } else {
            await m.reply(
                `╭───(    TOXIC-MD    )───\n` +
                `├───≫ ANTITAG ≪───\n` +
                `├ \n` +
                `├ Current Antitag setting: ${isEnabled ? 'ON' : 'OFF'}\n` +
                `├ Use ${prefix}antitag on or ${prefix}antitag off to change it, peasant!\n` +
                `╰──────────────────☉\n` +
                `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            );
        }
    });
};
