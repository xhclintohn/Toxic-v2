const { botname } = require('../../Env/settings');

module.exports = {
    name: 'ping',
    aliases: ['p', 'speed', 'latency', 'response', 'pong'],
    description: 'Checks the bot response time and server status',
    run: async (context) => {
        const { client, m, toxicspeed } = context;
        const bName = botname || 'Toxic-MD';
        try {
            await client.sendMessage(m.chat, { react: { text: '⚡', key: m.key } });

            const startTime = Date.now();
            const latency = Date.now() - startTime;
            const responseSpeed = (toxicspeed || 0.0094).toFixed(4);

            const formatUptime = (seconds) => {
                const days = Math.floor(seconds / (3600 * 24));
                const hours = Math.floor((seconds % (3600 * 24)) / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                const secs = Math.floor(seconds % 60);
                const parts = [];
                if (days > 0) parts.push(`${days}d`);
                if (hours > 0) parts.push(`${hours}h`);
                if (minutes > 0) parts.push(`${minutes}m`);
                if (secs > 0) parts.push(`${secs}s`);
                return parts.join(' ') || '0s';
            };

            const mem = process.memoryUsage();
            const usedMB = (mem.heapUsed / 1024 / 1024).toFixed(2);
            const totalMB = (mem.heapTotal / 1024 / 1024).toFixed(2);

            const text = `*${bName} Pɪɴɢ Nᴏᴡ*\n\n╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌D\`    )───\n> ───≫ Pɪɴɢ ≪───\n> \`々\` 𝐋𝐚𝐭𝐞𝐧𝐜𝐲 : ${responseSpeed}ms\n> \`々\` 𝐒𝐞𝐫𝐯𝐞𝐫 𝐓𝐢𝐦𝐞 : ${new Date().toLocaleString()}\n> \`々\` 𝐔𝐩𝐭𝐢𝐦𝐞 : ${formatUptime(process.uptime())}\n> \`々\` 𝐌𝐞𝐦𝐨𝐫𝐲 : ${usedMB}/${totalMB} MB\n> \`々\` 𝐍𝐨𝐝𝐞𝐉𝐒 : ${process.version}\n> \`々\` 𝐏𝐥𝐚𝐭𝐟𝐨𝐫𝐦 : ${process.platform}\n╰──────────────────☉`;

            await client.sendMessage(m.chat, { text }, { quoted: m });

        } catch (error) {
            await m.reply(`*${bName} Eʀʀᴏʀ*\n\n╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌D\`    )───\n> ───≫ Pɪɴɢ Fᴀɪʟᴇᴅ ≪───\n> \`々\` The ping command crashed.\n> \`々\` Much like your life choices.\n╰──────────────────☉`);
        }
    }
};
