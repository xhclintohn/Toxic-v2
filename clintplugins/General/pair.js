module.exports = async (context) => {
    const { client, m, text } = context;

    try {
        if (!text) {
            return await client.sendMessage(m.chat, { text: `📱 *Please provide a number to pair!* Example: *${prefix}pair 1234567890*` }, { quoted: m });
        }

        const numbers = text.split(',')
            .map(v => v.replace(/[^0-9]/g, ''))
            .filter(v => v.length > 5 && v.length < 20);

        if (numbers.length === 0) {
            return await client.sendMessage(m.chat, { text: `❌ *Invalid number!* Please enter a valid phone number (6-20 digits).` }, { quoted: m });
        }

        for (const number of numbers) {
            const whatsappID = number + '@s.whatsapp.net';
            const result = await client.onWhatsApp(whatsappID);

            if (!result[0]?.exists) {
                return await client.sendMessage(m.chat, { text: `🚫 *Number ${number} is not registered on WhatsApp!* Please use a valid WhatsApp number.` }, { quoted: m });
            }

            const replyText = `📱 *Pairing for ${number}*\n\nTo get your pairing code, visit https://toxicpairing.com\n\nFollow the instructions there to obtain your pairing code and link your device.\n\n◈━━━━━━━━━━━━━━━━◈\nPowered by *𝐓𝐎XIC-MD 𝐕3*`;

            await client.sendMessage(m.chat, { text: replyText }, { quoted: m });
        }
    } catch (error) {
        console.error('Error in pair command:', error);
        await client.sendMessage(m.chat, { text: `⚠️ *Oops! Failed to process pairing:* ${error.message}\n\nVisit https://github.com/xhclintohn/Toxic-MD for pairing instructions.` }, { quoted: m });
    }
};