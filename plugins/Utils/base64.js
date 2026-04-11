module.exports = {
    name: 'base64',
    aliases: ['tobase64', 'b64', 'encode64'],
    description: 'Encodes text to Base64. Reply to a message or provide text after the command.',
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
            return m.reply('╭───(    TOXIC-MD    )───\n├───≫ Base64 Encode ≪───\n├ \n├ Reply to text or provide it after\n├ the command.\n├ \n├ Usage: .base64 Hello World\n├        .tobase64 [reply to text]\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
        }

        const encoded = Buffer.from(input, 'utf8').toString('base64');
        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Base64 Encode ≪───\n├ \n├ 📥 *Input:*\n├ ${input.slice(0, 80)}${input.length > 80 ? '...' : ''}\n├ \n├ 📤 *Encoded:*\n├ \n${encoded}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};
