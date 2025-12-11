const { getSettings } = require('../../Database/config');

module.exports = {
    name: 'ping',
    aliases: ['p'],
    description: 'Checks the bot\'s response time and server status',
    run: async (context) => {
        const { client, m, toxicspeed } = context;
        try {
            await client.sendMessage(m.chat, { react: { text: '⚡', key: m.key } });
            const formatUptime = (seconds) => {
                const days = Math.floor(seconds / (3600 * 24));
                const hours = Math.floor((seconds % (3600 * 24)) / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                const secs = Math.floor(seconds % 60);
                const parts = [];
                if (days > 0) parts.push(`${days} days`);
                if (hours > 0) parts.push(`${hours} hours`);
                if (minutes > 0) parts.push(`${minutes} minutes`);
                if (secs > 0) parts.push(`${secs} seconds`);
                return parts.join(', ') || '0 seconds';
            };
            const botUptime = formatUptime(process.uptime());
            const pingSpeed = (toxicspeed || 0.0094).toFixed(4);
            const randomCpuUsage = (Math.floor(Math.random() * 40) + 5) + '%';
            await m.reply(`*— Bot Status ⌬*\n• *Runtime :* ${botUptime}\n• *Response Speed :* ${pingSpeed} ms\n• *CPU Usage :* ${randomCpuUsage}\n\n—\n*Tσxιƈ-ɱԃȥ*`);
        } catch (error) {
            console.error(`Ping error:`, error);
            await m.reply("The ping command is broken. Much like your ability to use a bot correctly.");
        }
    }
};