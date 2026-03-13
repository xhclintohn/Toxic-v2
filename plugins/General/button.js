const { default: makeWASocket } = require('@whiskeysockets/baileys');

module.exports = {
  name: 'buttonz',
  aliases: ['btn'],
  description: 'Displays a list selection menu',
  run: async (context) => {
    const { client, m } = context;

    try {
      await client.sendMessage(m.chat, {
        text: `╭───(    TOXIC-MD    )───\n├───≫ Mᴇɴᴜ ≪───\n├ \n├ Choose an option from the list:\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
        footer: 'Toxic-MD Bot',
        sections: [
          {
            title: 'General Commands',
            rows: [
              { title: 'Help', rowId: '.help', description: 'Get bot commands' },
              { title: 'Ping', rowId: '.ping', description: 'Check bot speed' },
              { title: 'Info', rowId: '.info', description: 'View bot details' }
            ]
          },
          {
            title: 'Fun Commands',
            rows: [
              { title: 'Random Fact', rowId: '.fact', description: 'Get a fun fact' },
              { title: 'Joke', rowId: '.joke', description: 'Hear a joke' }
            ]
          }
        ],
        buttonText: 'Open Menu',
        headerType: 1,
        viewOnce: true
      }, { quoted: m });

    } catch (error) {
      console.error(`Menu command error: ${error.stack}`);
    }
  }
};
