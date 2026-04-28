import { getSudoUsers } from '../../database/config.js';

  export default {
      name: 'checksudo',
      aliases: ['listsudo', 'sudolist', 'sudos', 'listsudos', 'sudousers', 'getsudo'],
      description: 'List all sudo users',
      run: async (context) => {
          const { client, m } = context;
          await client.sendMessage(m.chat, { react: { text: '⏳', key: m.reactKey } });

          const sudoUsers = await getSudoUsers();

          if (!sudoUsers || sudoUsers.length === 0) {
              await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
              return m.reply("╭───(    TOXIC-MD    )───\n├ No Sudo Users found. You're all alone.\n╰──────────────────☑\n> ©𝐏𝐨𝐰𝐞𝐫𝐞ꀠ𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
          }

          await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });
          await m.reply(`╭───(    TOXIC-MD    )───\n├───≡ SUDO USERS ≢───\n├ \n${sudoUsers.map((jid) => `├ ${jid}`).join('\n')}\n╰──────────────────☑\n> ©𝐏𝐨𝐰𝐞𝐫𝐞ꀠ𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }
  };
  