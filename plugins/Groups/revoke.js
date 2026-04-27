import middleware from '../../utils/botUtil/middleware.js';
import { getFakeQuoted } from '../../lib/fakeQuoted.js';

export default async (context) => {
    await middleware(context, async () => {
        const { client, m, groupMetadata } = context;
        const fq = getFakeQuoted(m);

await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });
await client.groupRevokeInvite(m.chat); 
   await client.sendText(m.chat, `╭───(    TOXIC-MD    )───\n├───≫ REVOKED ≪───\n├ \n├ Group link revoked!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`, m); 
   let response = await client.groupInviteCode(m.chat); 
 client.sendText(m.sender, `╭───(    TOXIC-MD    )───\n├───≫ NEW LINK ≪───\n├ \n├ https://chat.whatsapp.com/${response}\n├ \n├ New group link for ${groupMetadata.subject}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`, m, { detectLink: true }); 
 client.sendText(m.chat, `╭───(    TOXIC-MD    )───\n├ \n├ Sent you the new group link in private!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`, m); 

})

}

