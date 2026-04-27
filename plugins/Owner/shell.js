import ownerMiddleware from '../../utils/botUtil/Ownermiddleware.js';
import { getFakeQuoted } from '../../lib/fakeQuoted.js';

    
      import { exec } from 'child_process';
export default async (context) => {

await ownerMiddleware(context, async () => {

  
    const { client, m, text, budy, Owner } = context;
    const fq = getFakeQuoted(m);
    await client.sendMessage(m.chat, { react: { text: '⚡', key: m.reactKey } });

    try {
      

      
      if (!text) {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });
        return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ No command provided. Provide a\n├ valid shell command, fool.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }


    
      exec(text, (err, stdout, stderr) => {
        if (err) {
          return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ SHELL ERROR ≪───\n├ \n├ ${err.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
        if (stderr) {
          return m.reply(stderr);
        }
        if (stdout) {
          return m.reply(stdout);
        }
      });

    } catch (error) {
      await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ SHELL ERROR ≪───\n├ \n├ An error occurred while running\n├ the shell command.\n├ ${error}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
                  })
}
