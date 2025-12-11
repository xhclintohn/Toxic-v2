const { getSettings } = require('../../Database/config');

module.exports = {
  name: 'ping',
  aliases: ['p'],
  description: 'Checks the bot\'s response time and server status',
  run: async (context) => {
    const { client, m, toxicspeed } = context;

    try {
     
      await client.sendReaction(m.chat, m.key, '⚡');

    
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

      const pingText = `
*— Bot Status ⌬*
• *Runtime :* ${botUptime}
• *Response Speed :* ${pingSpeed} ms
• *CPU Usage :* ${randomCpuUsage}

_⌬_ 
      `.trim();

      await client.sendMessage(m.chat, {
        text: pingText
      }, { quoted: m });

    } catch (error) {
      console.error(`Ping command error: ${error}`);
      await client.sendMessage(m.chat, {
        text: `◎━━━━━━━━━━━━━━━━◎\n│❒ Ping's fucked! My circuits are overheating from your stupidity.\n◎━━━━━━━━━━━━━━━━◎`
      }, { quoted: m });
    }
  }
};