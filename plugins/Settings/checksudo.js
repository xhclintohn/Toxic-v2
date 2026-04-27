import ownerMiddleware from '../../utils/botUtil/Ownermiddleware.js';
import { getSudoUsers } from '../../database/config.js';
import { getFakeQuoted } from '../../lib/fakeQuoted.js';

export default async (context) => {
  
    const { m } = context;
    const fq = getFakeQuoted(m);

    const sudoUsers = await getSudoUsers();

    if (!sudoUsers || sudoUsers.length === 0) {
      await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });
      return await m.reply("╭───(    TOXIC-MD    )───\n├ No Sudo Users found. You're all alone.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
    }

    await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ SUDO USERS ≪───\n├ \n${sudoUsers.map((jid) => `├ ${jid}`).join('\n')}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
 
};
