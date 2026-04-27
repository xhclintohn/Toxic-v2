import util from 'util';
import ownerMiddleware from '../../utils/botUtil/Ownermiddleware.js';
import { getFakeQuoted } from '../../lib/fakeQuoted.js';

const BLOCKED_PATTERNS = [
    /process\.env/,
    /config\/settings/,
    /require\s*\(\s*['"].*settings['"]/
];

export default async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, text, isAdmin, isBotAdmin, Owner, isDev, isSudo, itsMe, store, settings, botNumber, args, pushname, mode, pict, botname, totalCommands } = context;
        const fq = getFakeQuoted(m);
        await client.sendMessage(m.chat, { react: { text: '⚡', key: m.reactKey } });
        try {
            const trimmedText = text.trim();
            await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });
            if (!trimmedText) return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ No command provided for eval!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
            for (const pattern of BLOCKED_PATTERNS) {
                if (pattern.test(trimmedText)) return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ BLOCKED ≪───\n├ \n├ That eval is blocked for security.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
            }
            let evaled = await eval(trimmedText);
            if (typeof evaled !== 'string') evaled = util.inspect(evaled);
            if (evaled && evaled !== 'undefined' && evaled !== 'null') await m.reply(evaled);
        } catch (err) {
            await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ EVAL ERROR ≪───\n├ \n├ ${String(err)}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
    });
};
