module.exports = async (context) => {
    const { client, m, text, pict } = context;

    try {
        if (!text) {
            return await client.sendMessage(m.chat, {
                text: `🎵 *Please provide a song name!* Example: *.lyrics Alone*`
            }, { quoted: m });
        }

        // Placeholder: Simulate lyrics data (replace with your own lyrics source if available)
        const mockData = {
            success: true,
            result: {
                title: text,
                artist: "Unknown Artist",
                lyrics: "Sample lyrics for demonstration purposes.\nReplace with actual lyrics data.",
                thumb: null
            }
        };

        if (!mockData.success || !mockData.result || !mockData.result.lyrics) {
            return await client.sendMessage(m.chat, {
                text: `❌ *Sorry, I couldn't find lyrics for "${text}"!* Try another song.`
            }, { quoted: m });
        }

        const { title, artist, lyrics } = mockData.result;

        const caption = `🎵 *Song Lyrics*\n\n` +
                       `📜 *Title*: ${title}\n` +
                       `🎤 *Artist*: ${artist}\n\n` +
                       `${lyrics}\n\n` +
                       `◈━━━━━━━━━━━━━━━━◈\nPowered by *𝐓𝐎𝐗𝐈𝐂-MD 𝐕3*`;

        await client.sendMessage(m.chat, {
            image: { url: pict }, // Use context-provided pict
            caption: caption
        }, { quoted: m });
    } catch (error) {
        console.error('Error in lyrics command:', error);
        await client.sendMessage(m.chat, {
            text: `⚠️ *Oops! Failed to fetch lyrics for "${text}":* ${error.message}`
        }, { quoted: m });
    }
};