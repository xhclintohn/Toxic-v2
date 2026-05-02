import { generateWAMessageFromContent, proto } from '@whiskeysockets/baileys';
import { getFakeQuoted } from '../../lib/fakeQuoted.js';

export default {
    name: 'testbutton',
    aliases: ['tb'],
    description: 'Send a single_select button (works on iOS and Android)',
    run: async (context) => {
        const { client, m, prefix } = context;
        const fq = getFakeQuoted(m);

        const msg = generateWAMessageFromContent(
            m.chat,
            proto.Message.fromObject({
                interactiveMessage: {
                    body: { text: 'Pick a command to run:' },
                    footer: { text: 'Toxic-MD' },
                    nativeFlowMessage: {
                        messageVersion: 1,
                        buttons: [{
                            name: 'single_select',
                            buttonParamsJson: JSON.stringify({
                                title: 'Select a command',
                                sections: [{
                                    title: 'Bot Commands',
                                    rows: [
                                        { title: 'Ping', description: 'Check bot response time', id: `${prefix}ping` },
                                        { title: 'Alive', description: 'Confirm bot is running', id: `${prefix}alive` },
                                        { title: 'Menu', description: 'Open the main menu', id: `${prefix}menu` }
                                    ]
                                }]
                            })
                        }]
                    }
                }
            }),
            { quoted: fq }
        );

        await client.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    }
};
