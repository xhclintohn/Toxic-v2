const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, text } = context;

        const options = ['all', 'contacts', 'contact_blacklist', 'none'];

        if (!text || !options.includes(text.toLowerCase())) {
            return m.reply(`╭───(    TOXIC-MD    )───\n├───≥ MESSAGE PRIVACY ≤───\n├ \n├ Set who can message you.\n├ Options: ${options.join(' / ')}\n├ Example: .messageprivacy contacts\n╰──────────────────☉\n> ©𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }

        await client.updateMessagesPrivacy(text.toLowerCase());
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≥ MESSAGE PRIVACY ≤───\n├ \n├ Updated to: *${text.toLowerCase()}*\n╰──────────────────☉\n> ©𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    });
};
