const { getFakeQuoted } = require('../../lib/fakeQuoted');
module.exports = {
    name: 'checkid',
    aliases: ['cekid', 'getid', 'id', 'idch'],
    description: 'Get the JID of a WhatsApp group or channel from its invite link',
    run: async (context) => {
        const { client, m, prefix } = context;
        const fq = getFakeQuoted(m);

        try {
            const text = m.body.trim();
            const linkMatch = text.match(/https?:\/\/(chat\.whatsapp\.com|whatsapp\.com\/channel)\/[^\s]+/i);
            const link = linkMatch ? linkMatch[0] : null;

            if (!link) {
                return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Where's the link?\n├ Example: ${prefix}checkid https://chat.whatsapp.com/xxxxx\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
            }

            await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

            let url;
            try {
                url = new URL(link);
            } catch {
                await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ That's not a valid URL.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
            }

            if (url.hostname === 'chat.whatsapp.com' && /^\/[A-Za-z0-9]{20,}$/.test(url.pathname)) {
                const code = url.pathname.replace(/^\/+/, '');
                const res = await client.groupGetInviteInfo(code);
                const id = res.id;

                await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

                await client.sendMessage(m.chat, {
                    interactiveMessage: {
                        header: `╭───(    TOXIC-MD    )───\n├───≫ Gʀᴏᴜᴘ Aɴᴀʟʏsɪs ≪───\n├ \n├ *Link:* ${link}\n├ *Invite Code:* \`${code}\`\n├ *Group ID:* \`${id}\`\n╰──────────────────☉`,
                        footer: '©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧',
                        buttons: [{
                            name: 'cta_copy',
                            buttonParamsJson: JSON.stringify({ display_text: '📋 Copy Group ID', copy_code: id })
                        }]
                    }
                }, { quoted: fq });

            } else if (url.hostname === 'whatsapp.com' && url.pathname.startsWith('/channel/')) {
                const code = url.pathname.split('/channel/')[1]?.split('/')[0];
                if (!code) {
                    await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                    return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Invalid channel link format.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
                }

                const res = await client.newsletterMetadata('invite', code, 'GUEST');
                const id = res.id;

                await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

                await client.sendMessage(m.chat, {
                    interactiveMessage: {
                        header: `╭───(    TOXIC-MD    )───\n├───≫ Cʜᴀɴɴᴇʟ Aɴᴀʟʏsɪs ≪───\n├ \n├ *Link:* ${link}\n├ *Channel Code:* \`${code}\`\n├ *Channel ID:* \`${id}\`\n╰──────────────────☉`,
                        footer: '©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧',
                        buttons: [{
                            name: 'cta_copy',
                            buttonParamsJson: JSON.stringify({ display_text: '📋 Copy Channel ID', copy_code: id })
                        }]
                    }
                }, { quoted: fq });

            } else {
                await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ That's not a WhatsApp group or channel link.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
            }

        } catch (error) {
            console.error('CheckID error:', error);
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Cʀᴀsʜᴇᴅ ≪───\n├ \n├ Error: ${error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
    }
};
