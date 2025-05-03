const { DateTime } = require('luxon');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'crash',
  aliases: ['crashbeta', 'killios'],
  description: 'Simulates a system crash or termination with a fun message',
  execute(message, args) {
    try {
      // Get current time using luxon
      const now = DateTime.local().toLocaleString(DateTime.DATETIME_FULL);

      // Determine which alias was used for a tailored response
      const command = message.content.toLowerCase();
      let response;
      if (command.startsWith('.crash')) {
        response = `💥 System crash initiated at ${now}! Brace for impact!`;
      } else if (command.startsWith('.crashbeta')) {
        response = `🧪 Beta system crash triggered at ${now}! Testing chaos!`;
      } else if (command.startsWith('.killios')) {
        response = `🍎 iOS terminated at ${now}! Shutting down... 💀`;
      }

      // Send response to the channel
      message.reply(response);

      // Optionally log the command usage
      const logMessage = `[${now}] ${message.author.tag} used ${command}\n`;
      fs.appendFileSync(path.join(__dirname, 'command.log'), logMessage);
    } catch (error) {
      console.error(`Error in crash command: ${error}`);
      message.reply('⚠️ Oops, something broke! Try again later.');
    }
  },
};