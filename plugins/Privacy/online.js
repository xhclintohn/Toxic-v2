module.exports = async (context) => {

const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');
const { getFakeQuoted } = require('../../lib/fakeQuoted');

    await ownerMiddleware(context, async () => {

    const { client, m, text} = context;
    const fq = getFakeQuoted(m);

if (!text) {
      m.reply("╭───(    TOXIC-MD    )───\n├ Provide a setting to update, you clueless fool.\n├ Example: online all\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
      return;
    }


const availablepriv = ['all', 'match_last_seen'];

if (!availablepriv.includes(text)) return m.reply(`╭───(    TOXIC-MD    )───\n├ Pick from: ${availablepriv.join('/')}\n├ It's not that hard.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

await client.updateOnlinePrivacy(text)
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ONLINE PRIVACY ≪───\n├ \n├ Privacy updated to: *${text}*\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

})

}
