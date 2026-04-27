import { getWarnCount, addWarn, resetWarn, getGroupSettings } from '../../database/config.js';
import { getFakeQuoted } from '../../lib/fakeQuoted.js';
import { resolveTargetJid, resolvePhoneNumber } from '../../lib/lidResolver.js';

export default {
    name: 'warn',
    alias: ['warns', 'warnlist'],
    description: 'Warn a group member',
    run: async (context) => {
        const { client, m, isAdmin, isBotAdmin } = context;
        const fq = getFakeQuoted(m);
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });

        if (!m.isGroup) return m.reply(`╭───(    TOXIC-MD    )───\n├ Group only command.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        if (!isAdmin && !isBotAdmin) return m.reply(`╭───(    TOXIC-MD    )───\n├ Admin only.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

        let rawJid = m.quoted?.sender || m.mentionedJid?.[0];
        if (!rawJid) return m.reply(`╭───(    TOXIC-MD    )───\n├ Reply to or mention the rat you wanna warn.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

        const groupMetadata = await client.groupMetadata(m.chat);
        const participants = groupMetadata.participants;
        const target = resolveTargetJid(rawJid, participants);
        if (!target) return m.reply(`╭───(    TOXIC-MD    )───\n├ Couldn't find that person in this group.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

        const gs = await getGroupSettings(m.chat);
        const warnLimit = gs.warn_limit || 3;
        const userNum = target.split('@')[0].split(':')[0];
        const count = await addWarn(m.chat, userNum);

        if (count >= warnLimit) {
            await resetWarn(m.chat, userNum);
            try { await client.groupParticipantsUpdate(m.chat, [target], 'remove'); } catch {}
            await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });
            return client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├───≫ KICKED ≪───\n├ @${userNum} hit \`${count}/${warnLimit}\` warns.\n├ Bye bye rat 👋\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                mentions: [target]
            }, { quoted: fq });
        }

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });
        return client.sendMessage(m.chat, {
            text: `╭───(    TOXIC-MD    )───\n├───≫ WARNED ≪───\n├ @${userNum}\n├ Warns: \`${count}/${warnLimit}\`\n├ One more and it's the door.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
            mentions: [target]
        }, { quoted: fq });
    }
};
