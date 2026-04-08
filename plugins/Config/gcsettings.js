const { getGroupSettings } = require('../../database/config');
const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { m } = context;

        const jid = m.chat;
        console.log(`Received request for group: ${jid}`);

        if (!jid.endsWith('@g.us')) {
            console.log('The command was not issued in a group chat.');
            return await m.reply("╭───(    TOXIC-MD    )───\n├ This command is for groups only, you fool.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
        }

        console.log(`Fetching group settings for group: ${jid}`);
        let groupSettings = await getGroupSettings(jid);

        if (!groupSettings) {
            console.log(`No settings found for group: ${jid}`);
            return await m.reply("╭───(    TOXIC-MD    )───\n├ No group settings found. Configure something first!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
        }

        console.log(`Group settings for ${jid}: ${JSON.stringify(groupSettings)}`);

        let response = `╭───(    TOXIC-MD    )───\n├───≫ GROUP SETTINGS ≪───\n├ \n`;
        response += `├ Antilink: ${groupSettings.antilink ? 'ON' : 'OFF'}\n`;
        response += `├ Antidelete: ${groupSettings.antidelete ? 'ON' : 'OFF'}\n`;
        response += `├ Events: ${groupSettings.events ? 'ON' : 'OFF'}\n`;
        response += `├ Antitag: ${groupSettings.antitag ? 'ON' : 'OFF'}\n`;
        response += `├ GCPresence: ${groupSettings.gcpresence ? 'ON' : 'OFF'}\n`;
        response += `├ Antiforeign: ${groupSettings.antiforeign ? 'ON' : 'OFF'}\n`;
        response += `├ Antidemote: ${groupSettings.antidemote ? 'ON' : 'OFF'}\n`;
        response += `├ Antipromote: ${groupSettings.antipromote ? 'ON' : 'OFF'}\n`;
        response += `├ Welcome: ${groupSettings.welcome ? 'ON' : 'OFF'}\n`;
        response += `├ Goodbye: ${groupSettings.goodbye ? 'ON' : 'OFF'}\n`;
        response += `╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

        await m.reply(response);
    });
};
