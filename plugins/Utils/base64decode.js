module.exports = {
    name: 'base64decode',
    aliases: ['unbase64', 'debase64', 'frombase64', 'decode64', 'b64decode'],
    description: 'Decodes Base64 text back to plain text. Reply to a message or provide base64 after the command.',
    run: async (context) => {
        const { client, m, text } = context;

        let input = (text || '').trim();

        if (!input && m.quoted) {
            input = (
                m.quoted.text ||
                m.quoted.body ||
                m.quoted.message?.conversation ||
                m.quoted.message?.extendedTextMessage?.text ||
                ''
            ).trim();
        }

        if (!input) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply('╭───(    TOXIC-MD    )───\n├───≫ Base64 Decode ≪───\n├ \n├ Reply to base64 text or provide it\n├ after the command.\n├ \n├ Usage: .unbase64 SGVsbG8gV29ybGQ=\n├        .debase64 [reply to base64]\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
        }

        let decoded = '';
        try {
            const buf = Buffer.from(input.replace(/\s/g, ''), 'base64');
            decoded = buf.toString('utf8');
            if (!decoded || !decoded.trim()) throw new Error('empty result');
        } catch {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply('╭───(    TOXIC-MD    )───\n├───≫ Base64 Decode ≪───\n├ \n├ That is not valid Base64 text.\n├ Make sure you\'re passing encoded\n├ Base64, not regular text.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
        }

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Base64 Decode ≪───\n├ \n├ 📥 *Input (Base64):*\n├ ${input.slice(0, 60)}${input.length > 60 ? '...' : ''}\n├ \n├ 📤 *Decoded:*\n├ \n${decoded}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};
