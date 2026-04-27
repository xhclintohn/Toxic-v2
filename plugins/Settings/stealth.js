import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import { getSettings, updateSetting } from '../../database/config.js';
import ownerMiddleware from '../../utils/botUtil/Ownermiddleware.js';
import { getFakeQuoted } from '../../lib/fakeQuoted.js';

export default async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, args, prefix } = context;
        const fq = getFakeQuoted(m);

        const fmt = (msg) => `╭───(    TOXIC-MD    )───\n├ ${msg}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

        try {
            const settings = await getSettings();
            const isEnabled = settings.stealth === 'true' || settings.stealth === true;
            const value = args[0]?.toLowerCase();

            if (value === 'on') {
                if (isEnabled) return const _stealthMsg = generateWAMessageFromContent(m.chat, { interactiveMessage: { body: { text: fmt(`Stealth Mode: *${isEnabled ? 'ON 👻' : 'OFF 💡'}*\n├ Usage: *${prefix}stealth on/off*\n├ When ON, bot auto-deletes commands + replies after 8s.`) }, footer: { text: '' }, nativeFlowMessage: { buttons: [{ name: 'single_select', buttonParamsJson: JSON.stringify({ title: 'Choose an option', sections: [{ rows: [                                                    { title: 'ON 👻', id: `${prefix}stealth on` },
                                                    { title: 'OFF 💡', id: `${prefix}stealth off` }] }] }) }] } } }, { quoted: fq });
            await client.relayMessage(m.chat, _stealthMsg.message, { messageId: _stealthMsg.key.id });
        } catch (err) {
            await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });
            await client.sendMessage(m.chat, { text: fmt(`Crashed. 💀 Error: ${err.message}`) }, { quoted: fq });
        }
    });
};
