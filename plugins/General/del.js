module.exports = {
  name: 'del',
  aliases: ['delete', 'd'],
  description: 'Deletes the replied-to or quoted message, you lazy fuck',
  run: async (context) => {
    const { client, m, botname } = context;

    try {
      if (!m || !m.key) {
        return;
      }

      if (!m.quoted) {
        return;
      }

      const isGroup = m.chat?.endsWith('@g.us');
      const userNumber = m.sender.split('@')[0];
      
      const deleteKey = {
        remoteJid: m.chat,
        fromMe: m.quoted.fromMe || false,
        id: m.quoted.id,
        participant: m.quoted.fromMe ? undefined : m.quoted.sender
      };

      await client.sendMessage(m.chat, { delete: deleteKey });

    } catch (error) {
      console.error(`del command error:`, error);
    }
  }
};
