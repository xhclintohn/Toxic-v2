module.exports = async (context) => {
    const { client, m, prefix, pict } = context;

    try {
        const caption = `🟢 *Hello ${m.pushName}, T𝐎𝐗𝐈𝐂-𝐌𝐃 𝐕3 is online!*\n\nType *${prefix}menu* to explore my commands.\n\n◈━━━━━━━━━━━━━━━━◈\nPowered by *𝐓𝐎𝐗𝐈𝐂-MD 𝐕3*`;

        await client.sendMessage(m.chat, {
            image: pict, // Assuming pict is provided in context; replace with local image path if needed
            caption: caption
        }, { quoted: m });
    } catch (error) {
        console.error('Error in alive command:', error);
        await client.sendMessage(m.chat, { text: `Oops! Failed to check status: ${error.message}` }, { quoted: m });
    }
};