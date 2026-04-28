import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import { getGroupSettings, updateGroupSetting } from '../../database/config.js';
import ownerMiddleware from '../../utils/botUtil/Ownermiddleware.js';
import { getFakeQuoted } from '../../lib/fakeQuoted.js';
import { getDeviceMode } from '../../lib/deviceMode.js';

export default async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, args, prefix } = context;
        const fq = getFakeQuoted(m);
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });
        const value = args[0]?.toLowerCase();
        const jid = m.chat;

        const formatStylishReply = (title, message) => {
            return `╭───(    TOXIC-MD    )───\n├───≫ ${title} ≪───\n├ \n├ ${message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
        };

        if (!jid.endsWith('@g.us')) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } });
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
            return await client.sendMessage(m.chat, { text: formatStylishReply("ANTITAG", "This command can only be used in groups, fool!") }, { quoted: fq });
        }

        let groupSettings = await getGroupSettings(jid);
        let isEnabled = groupSettings?.antitag === true;

        const Myself = await client.decodeJid(client.user.id);
        const groupMetadata = await client.groupMetadata(m.chat);
        const userAdmins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id);
        const isBotAdmin = userAdmins.includes(Myself);

        if (value === 'on' && !isBotAdmin) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
            return await client.sendMessage(m.chat, { text: formatStylishReply("ANTITAG", "I need admin privileges to enable Antitag, you clown!") }, { quoted: fq });
        }

        if (value === 'on' || value === 'off') {
            const action = value === 'on';

            if (isEnabled === action) {
                await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
                return await client.sendMessage(m.chat, { text: formatStylishReply("ANTITAG", `Antitag is already ${value.toUpperCase()}, genius!`) }, { quoted: fq });
            }

            await updateGroupSetting(jid, 'antitag', action);
            await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });
            return await client.sendMessage(m.chat, { text: formatStylishReply("ANTITAG", `Antitag has been turned ${value.toUpperCase()} for this group.`) }, { quoted: fq });
        }

                const _devMode = await getDeviceMode();
        if (_devMode === 'ios') {
            await client.sendMessage(m.chat, { text: formatStylishReply("ANTITAG", `Antitag's ${isEnabled ? 'ON' : 'OFF'} right now. Pick one, peasant!`) }, { quoted: fq });
        } else {
    const _msg = generateWAMessageFromContent(
            m.chat,
            {
                interactiveMessage: {
                    body: { text: formatStylishReply("ANTITAG", `Antitag's ${isEnabled ? 'ON' : 'OFF'} right now. Pick one, peasant!`) },
                    footer: { text: '' },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: 'single_select',
                                buttonParamsJson: JSON.stringify({
                                    title: 'Choose an option',
                                    sections: [{
                                        rows: [
                                                                                                    { title: 'ON ✅', id: `${prefix}antitag on` },
                                                            { title: 'OFF ❌', id: `${prefix}antitag off` }
                                        ]
                                    }]
                                })
                            }
                        ]
                    }
                }
            },
            { quoted: fq }
          );
          await client.relayMessage(m.chat, _msg.message, { messageId: _msg.key.id });
        }
    });
};
