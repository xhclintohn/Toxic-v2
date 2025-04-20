module.exports = async (context) => {
    const { client, m } = context;

    try {
        const formatUptime = (seconds) => {
            seconds = Number(seconds);
            const days = Math.floor(seconds / (3600 * 24));
            const hours = Math.floor((seconds % (3600 * 24)) / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);

            const daysDisplay = days > 0 ? `${days} ${days === 1 ? 'day' : 'days'}, ` : '';
            const hoursDisplay = hours > 0 ? `${hours} ${hours === 1 ? 'hour' : 'hours'}, ` : '';
            const minutesDisplay = minutes > 0 ? `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}, ` : '';
            const secsDisplay = secs > 0 ? `${secs} ${secs === 1 ? 'second' : 'seconds'}` : '';

            return (daysDisplay + hoursDisplay + minutesDisplay + secsDisplay).replace(/,\s*$/, '');
        };

        const uptimeText = formatUptime(process.uptime());
        const replyText = `⏰ *Bot Uptime*\n\n*𝐓𝐎XIC-𝐌𝐃 𝐕3* has been running for: *${uptimeText}*\n\n◈━━━━━━━━━━━━━━━━◈\nPowered by *𝐓𝐎XIC-MD 𝐕3*`;

        await client.sendMessage(m.chat, { text: replyText }, { quoted: m });
    } catch (error) {
        console.error('Error in uptime command:', error);
        await client.sendMessage(m.chat, { text: `⚠️ *Oops! Failed to fetch uptime:* ${error.message}` }, { quoted: m });
    }
};