import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import ownerMiddleware from '../../utils/botUtil/Ownermiddleware.js';
import { getFakeQuoted } from '../../lib/fakeQuoted.js';

export default async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, args, prefix } = context;
        const fq = getFakeQuoted(m);

        const fmt = (msg) => `╭───(    TOXIC-MD    )───\n├───≫ CALL PRIVACY ≪───\n├ \n├ ${msg}\n╰──────────────────☉\n> ©𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
        const options = ['all', 'known', 'none'];
        const value = (args[0] || '').toLowerCase();

        if (options.includes(value)) {
            try {
                await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });
                await client.updateCallPrivacy(value);
                await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });
                return m.reply(fmt(`Call privacy set to: *${value}*`));
            } catch (e) {
                await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } });
                return m.reply(fmt(`Failed: ${e.message?.slice(0, 60)}`));
            }
        }

        const _msg = generateWAMessageFromContent(m.chat, {
            interactiveMessage: {
                body: { text: fmt('Who can call you?\nSelect an option below.') },
                footer: { text: '' },
                nativeFlowMessage: {
                    buttons: [{
                        name: 'single_select',
                        buttonParamsJson: JSON.stringify({
                            title: 'Set Call Privacy',
                            sections: [{
                                rows: [
                                    { title: 'All ✅', description: 'Anyone can call you', id: `${prefix}callprivacy all` },
                                    { title: 'Known 👥', description: 'Only contacts can call', id: `${prefix}callprivacy known` },
                                    { title: 'None 🚫', description: 'Nobody can call you', id: `${prefix}callprivacy none` }
                                ]
                            }]
                        })
                    }]
                }
            }
        }, { quoted: fq });
        await client.relayMessage(m.chat, _msg.message, { messageId: _msg.key.id });
    });
};
