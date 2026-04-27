import ownerMiddleware from '../../utils/botUtil/Ownermiddleware.js';
import { getSettings, banUser, getBannedUsers, getSudoUsers } from '../../database/config.js';
import { getFakeQuoted } from '../../lib/fakeQuoted.js';
import { resolvePhoneNumber } from '../../lib/lidResolver.js';

export default async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, args, participants } = context;
        const fq = getFakeQuoted(m);
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });

        let settings = await getSettings();
        if (!settings) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
            return await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ BAN ≪───\n├ \n├ Settings not found, you broke something.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }

        const sudoUsers = await getSudoUsers();

        let numberToBan;

        if (m.quoted) {
            numberToBan = resolvePhoneNumber(m.quoted.sender, participants);
        } else if (m.mentionedJid && m.mentionedJid.length > 0) {
            numberToBan = resolvePhoneNumber(m.mentionedJid[0], participants);
        } else {
            numberToBan = (args[0] || '').replace(/[^0-9]/g, '');
        }

        if (!numberToBan) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
            return await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ BAN ≪───\n├ \n├ Please provide a valid number or quote a user, moron.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }

        if (sudoUsers.includes(numberToBan)) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
            return await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ BAN ≪───\n├ \n├ You cannot ban a Sudo User, you absolute fool!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }

        const bannedUsers = await getBannedUsers();

        if (bannedUsers.includes(numberToBan)) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
            return await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ BAN ≪───\n├ \n├ This user is already banned, genius.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }

        await banUser(numberToBan);
        await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ BAN ≪───\n├ \n├ ${numberToBan} has been banned. Get wrecked!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    });
};
