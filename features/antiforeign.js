import { getGroupSettings } from '../database/config.js';

const DEV_NUMBER = '254114885159';

const normalizeJid = (jid) => {
    if (!jid) return '';
    return jid.split('@')[0].split(':')[0].replace(/\D/g, '') + '@s.whatsapp.net';
};

export default async (client, event) => {
    try {
        if (!event || event.action !== 'add') return;

        const groupSettings = await getGroupSettings(event.id);
        if (!groupSettings?.antiforeign) return;

        const metadata = await client.groupMetadata(event.id);
        const botJid = normalizeJid(client.decodeJid(client.user.id));

        const isBotAdmin = metadata.participants.some(p => {
            const pJid = normalizeJid(p.id || p.jid || '');
            return pJid === botJid && (p.admin === 'admin' || p.admin === 'superadmin');
        });

        if (!isBotAdmin) return;

        // Determine allowed country code from bot number (first 3 digits)
        const botNum = botJid.split('@')[0].replace(/\D/g, '');
        // Use owner or bot's country prefix (first 3 chars, but be flexible for 2-digit codes)
        // Strategy: if new member's number doesn't match the bot's country prefix, kick them
        const BOT_COUNTRY_CODE = botNum.slice(0, 3); // e.g. "254"

        for (const participant of event.participants) {
            const pNum = participant.split('@')[0].split(':')[0].replace(/\D/g, '');
            if (!pNum) continue;

            // Skip developer and bot
            if (pNum === DEV_NUMBER) continue;
            if (normalizeJid(participant) === botJid) continue;

            // Check if number starts with a different country code
            const isForeign = !pNum.startsWith(BOT_COUNTRY_CODE.slice(0, 2));

            if (isForeign) {
                try {
                    await client.groupParticipantsUpdate(event.id, [normalizeJid(participant)], 'remove');
                    await client.sendMessage(event.id, {
                        text: `╭───(    TOXIC-MD    )───\n├───≫ ANTIFOREIGN ≪───\n├ \n├ 🚫 @${pNum} was removed.\n├ Foreign numbers not allowed here!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                        mentions: [normalizeJid(participant)]
                    });
                } catch {}
            }
        }
    } catch (err) {
        console.error('AntiForign Error:', err);
    }
};
