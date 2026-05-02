import { generateWAMessageFromContent, proto } from '@whiskeysockets/baileys';

export default {
    name: 'testbutton',
    aliases: ['tb'],
    description: 'Send a single_select button (iOS and Android)',
    run: async (context) => {
        const { client, m, prefix } = context;

        const msg = generateWAMessageFromContent(
            m.chat,
            proto.Message.fromObject({
                interactiveMessage: {
                    header: {
                        title: '',
                        hasMediaAttachment: false
                    },
                    body: { text: 'Pick a command to run:' },
                    footer: { text: 'Toxic-MD' },
                    contextInfo: {
                        isForwarded: true,
                        forwardingScore: 999,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363425667150709@newsletter',
                            newsletterName: 'Toxic-MD',
                            serverMessageId: 143
                        }
                    },
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
            {}
        );

        await client.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    }
};
