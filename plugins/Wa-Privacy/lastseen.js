module.exports = async (context) => {

const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');
    await ownerMiddleware(context, async () => {

    const { client, m, text} = context;

if (!text) {
      m.reply("╭───(    TOXIC-MD    )───\n├ Provide a setting to update, you clueless fool.\n├ Example: lastseen all\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
      return;
    }


const availablepriv = ['all', 'contacts', 'contact_blacklist', 'none'];

if (!availablepriv.includes(text)) return m.reply(`╭───(    TOXIC-MD    )───\n├ Pick from: ${availablepriv.join('/')}\n├ It's not that hard.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

await client.updateLastSeenPrivacy(text)
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ LAST SEEN ≪───\n├ \n├ Privacy updated to: *${text}*\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

})

}

