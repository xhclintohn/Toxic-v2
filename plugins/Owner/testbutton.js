import { generateWAMessageFromContent, proto } from '@whiskeysockets/baileys';
import { getFakeQuoted } from '../../lib/fakeQuoted.js';

const GITHUB = 'https://github.com/xhclintohn/Toxic-MD';

async function sendBtn(client, chat, content, fq) {
    const msg = generateWAMessageFromContent(
        chat,
        proto.Message.fromObject({ interactiveMessage: content }),
        { quoted: fq }
    );
    await client.relayMessage(chat, msg.message, { messageId: msg.key.id });
}

export default {
    name: 'testbutton',
    aliases: ['tb'],
    description: 'Send one test message per button type to verify iOS and Android rendering',
    run: async (context) => {
        const { client, m, prefix } = context;
        const fq = getFakeQuoted(m);

        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });

        try {
            await sendBtn(client, m.chat, {
                body: { text: `Test 1 of 5 — cta_copy\n\nTap the button below to copy a code to your clipboard.` },
                footer: { text: 'Toxic-MD' },
                nativeFlowMessage: {
                    messageVersion: 1,
                    buttons: [{
                        name: 'cta_copy',
                        buttonParamsJson: JSON.stringify({
                            display_text: 'Copy code',
                            copy_code: 'TOXIC-MD-TEST-2025'
                        })
                    }]
                }
            }, fq);
        } catch {
            await m.reply('cta_copy failed to render.');
        }

        try {
            await client.sendMessage(m.chat, {
                listMessage: {
                    title: 'Test 2 of 5 — list picker',
                    description: 'Tap the button below to open a selection list.',
                    buttonText: 'Open list',
                    listType: 1,
                    sections: [{
                        title: 'Commands',
                        rows: [
                            { title: 'Ping', description: 'Check bot response time', rowId: `${prefix}ping` },
                            { title: 'Alive', description: 'Confirm bot is running', rowId: `${prefix}alive` },
                            { title: 'Menu', description: 'Open the main menu', rowId: `${prefix}menu` }
                        ]
                    }],
                    footer: 'Toxic-MD'
                }
            }, { quoted: fq });
        } catch {
            await m.reply('list picker failed to render.');
        }

        try {
            await sendBtn(client, m.chat, {
                body: { text: `Test 3 of 5 — cta_url\n\nTap the button below to open a link in your browser.` },
                footer: { text: 'Toxic-MD' },
                nativeFlowMessage: {
                    messageVersion: 1,
                    buttons: [{
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: 'Open GitHub',
                            url: GITHUB,
                            merchant_url: GITHUB
                        })
                    }],
                    messageParamsJson: JSON.stringify({
                        bottom_sheet: { in_thread_buttons_limit: 3, divider_indices: [] },
                        tap_target_configuration: { canonical_url: GITHUB, url_type: 'STATIC', button_index: 0, tap_target_format: 1 },
                        tap_target_list: [{ canonical_url: GITHUB, url_type: 'STATIC', button_index: 0, tap_target_format: 1 }]
                    })
                }
            }, fq);
        } catch {
            await m.reply('cta_url failed to render.');
        }

        try {
            await sendBtn(client, m.chat, {
                body: { text: `Test 4 of 5 — quick_reply\n\nTap the button below to trigger a bot command automatically.` },
                footer: { text: 'Toxic-MD' },
                nativeFlowMessage: {
                    messageVersion: 1,
                    buttons: [{
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: 'Run ping',
                            id: `${prefix}ping`
                        })
                    }]
                }
            }, fq);
        } catch {
            await m.reply('quick_reply failed to render.');
        }

        try {
            await sendBtn(client, m.chat, {
                body: { text: `Test 5 of 5 — shop\n\nThis is a shop storefront button.` },
                footer: { text: 'Toxic-MD' },
                shopStorefrontMessage: proto.Message.InteractiveMessage.ShopMessage.fromObject({ surface: 2 })
            }, fq);
        } catch {
            await m.reply('shop failed to render.');
        }

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });
    }
};
