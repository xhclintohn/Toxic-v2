module.exports = async (context) => {
    const { client, m, toxicspeed } = context;

    try {
        const pingTime = toxicspeed.toFixed(4);
        const replyText = `🏓 *Pong!*\n⏱️ *Response Time*: ${pingTime}ms\n\n◈━━━━━━━━━━━━━━━━◈\nPowered by *𝐓𝐎𝐗𝐈𝐂-𝐌𝐃 𝐕3*`;

        await client.sendMessage(m.chat, { text: replyText }, { quoted: m });
    } catch (error) {
        console.error('Error in ping command:', error);
        await client.sendMessage(m.chat, { text: `Oops! Failed to ping: ${error.message}` }, { quoted: m });
    }
};