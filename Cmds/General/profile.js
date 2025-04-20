module.exports = async (context) => {
    const { client, m, pict } = context;

    try {
        const isQuoted = !!m.quoted;
        const sender = isQuoted ? m.quoted.sender : m.sender;
        const name = isQuoted ? `@${sender.split('@')[0]}` : m.pushName;

        let ppUrl = pict; // Default to context-provided image
        try {
            ppUrl = await client.profilePictureUrl(sender, 'image');
        } catch {
            ppUrl = pict; // Fallback to pict if profile picture is unavailable
        }

        let statusText = 'Not set';
        try {
            const status = await client.fetchStatus(sender);
            statusText = status.status || 'Not set';
        } catch {
            statusText = 'About not accessible due to privacy settings';
        }

        const caption = `👤 *Profile for ${name}*\n\n🖼️ *Profile Picture*: ${ppUrl ? 'Displayed below' : 'Not available'}\n📝 *About*: ${statusText}\n\n◈━━━━━━━━━━━━━━━━◈\nPowered by *𝐓𝐎𝐗𝐈𝐂-𝐌𝐃 𝐕3*`;

        const message = {
            image: { url: ppUrl },
            caption: caption,
            mentions: isQuoted ? [sender] : []
        };

        await client.sendMessage(m.chat, message, { quoted: m });
    } catch (error) {
        console.error('Error in profile command:', error);
        await client.sendMessage(m.chat, { text: `⚠️ *Oops! Failed to fetch profile:* ${error.message}\n\nTry again later!` }, { quoted: m });
    }
};