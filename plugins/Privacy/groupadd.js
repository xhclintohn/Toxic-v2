import ownerMiddleware from '../../utils/botUtil/Ownermiddleware.js';
import { getFakeQuoted } from '../../lib/fakeQuoted.js';
export default async (context) => {


    await ownerMiddleware(context, async () => {

    const { client, m, text} = context;
    const fq = getFakeQuoted(m);
    await client.sendMessage(m.chat, { react: { text: '⚙️', key: m.reactKey } });

if (!text) {
      await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });
      m.reply("╭───(    TOXIC-MD    )───\n├ Provide a setting to update, you clueless fool.\n├ Example: groupadd all\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
      return;
    }


const availablepriv = ['all', 'contacts', 'contact_blacklist', 'none'];

if (!availablepriv.includes(text)) return m.reply(`╭───(    TOXIC-MD    )───\n├ Pick from: ${availablepriv.join('/')}\n├ It's not that hard.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

await client.updateGroupsAddPrivacy(text)
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ GROUP ADD ≪───\n├ \n├ Privacy updated to: *${text}*\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

})

}
