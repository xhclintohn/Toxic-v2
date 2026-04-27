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
            const isEnabled = settings.multiprefix === 'true' || settings.multiprefix === true;
            const value = args[0]?.toLowerCase();

            if (value === 'on' || value === 'all') {
                if (isEnabled) return const _multiprefixMsg = generateWAMessageFromContent(m.chat, { interactiveMessage: { body: { text: fmt(`Multi-prefix already OFF, clown. 🙄 Single prefix: *${settings.prefix || '.'}*`) }, footer: { text: '' }, nativeFlowMessage: { buttons: [{ name: 'single_select', buttonParamsJson: JSON.stringify({ title: 'Choose an option', sections: [{ rows: [                                                    { title: 'ON 🔥', id: `${prefix}multiprefix on` },
                                                    { title: 'OFF 🧊', id: `${prefix}multiprefix off` }] }] }) }] } } }, { quoted: fq });
            await client.relayMessage(m.chat, _multiprefixMsg.message, { messageId: _multiprefixMsg.key.id });
        } catch (err) {
            await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });
            await client.sendMessage(m.chat, { text: fmt(`Exploded. 💀 Error: ${err.message}`) }, { quoted: fq });
        }
    });
};
