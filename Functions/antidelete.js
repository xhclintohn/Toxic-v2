const { getSettings, updateSetting } = require('../Database/config');
const { proto, generateWAMessageID } = require('@whiskeysockets/baileys');

module.exports = async (context) => {
  const { client, m, args, settings } = context;

  const formatStylishReply = (message) => {
    return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n┗━━━━━━━━━━━━━━━┛`;
  };

  if (!m.key.fromMe) {
    return await m.reply(formatStylishReply("Only the bot owner can toggle antidelete, loser! 🖕"));
  }

  const subCommand = args[0]?.toLowerCase();

  if (subCommand === 'status') {
    const isEnabled = settings.antidelete;
    return await m.reply(formatStylishReply(
      `🔍 *Anti-Delete Status*\n\n` +
      `• Enabled: ${isEnabled ? '✅ Yes' : '❌ No'}\n` +
      `• Forwards to: Bot's DM`
    ));
  }

  const newState = !settings.antidelete;
  await updateSetting('antidelete', newState);
  await m.reply(formatStylishReply(`Antidelete ${newState ? 'ENABLED' : 'DISABLED'} globally! ${newState ? 'Deleted messages will be forwarded to my DM! 🔒' : 'No more snooping on deletes, you rebel! 😎'}`));
};

const store = require('./Store');

module.exports.handleAntiDelete = async (client, m, store) => {
  if (!m || !m.message || !m.key) return;

  const settings = await getSettings();
  if (!settings.antidelete) return;

  if (m.message?.protocolMessage?.type === 0) {
    const deletedKey = m.message.protocolMessage.key;
    const remoteJid = deletedKey.remoteJid;
    
    if (!store.chats[remoteJid]) {
      store.chats[remoteJid] = [];
      return;
    }

    const chatMessages = store.chats[remoteJid];
    const deletedMessage = chatMessages.find(
      (msg) => msg.key.id === deletedKey.id
    );

    if (!deletedMessage) return;

    const botJid = client.decodeJid(client.user.id);
    const sender = client.decodeJid(deletedMessage.key.participant || deletedMessage.key.remoteJid);
    const deleter = m.key.participant ? m.key.participant.split('@')[0] : 'Unknown';
    const groupName = remoteJid.endsWith('@g.us') ? 'Group' : 'Private Chat';
    const deleteTime = new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' });

    try {
      const notification = `*AntiDelete Detected*\n\n*Time:* ${deleteTime}\n*Group:* ${groupName}\n*Deleted by:* @${deleter}\n*Sender:* @${sender.split('@')[0]}`;

      if (deletedMessage.message.conversation) {
        await client.sendMessage(botJid, {
          text: `${notification}\nDeleted message: ${deletedMessage.message.conversation}`,
          mentions: [sender]
        });
      }
      else if (deletedMessage.message.imageMessage) {
        const caption = deletedMessage.message.imageMessage.caption || '';
        const imageBuffer = await client.downloadMediaMessage(deletedMessage.message.imageMessage);
        await client.sendMessage(botJid, {
          image: imageBuffer,
          caption: `${notification}\n${caption}`,
          mentions: [sender]
        });
      }
      else if (deletedMessage.message.videoMessage) {
        const caption = deletedMessage.message.videoMessage.caption || '';
        const videoBuffer = await client.downloadMediaMessage(deletedMessage.message.videoMessage);
        await client.sendMessage(botJid, {
          video: videoBuffer,
          caption: `${notification}\n${caption}`,
          mentions: [sender]
        });
      }
      else if (deletedMessage.message.audioMessage) {
        const audioBuffer = await client.downloadMediaMessage(deletedMessage.message.audioMessage);
        await client.sendMessage(botJid, {
          audio: audioBuffer,
          ptt: true,
          caption: notification,
          mentions: [sender]
        });
      }
      else if (deletedMessage.message.stickerMessage) {
        const stickerBuffer = await client.downloadMediaMessage(deletedMessage.message.stickerMessage);
        await client.sendMessage(botJid, {
          sticker: stickerBuffer,
          caption: notification,
          mentions: [sender]
        });
      }
      else if (deletedMessage.message.extendedTextMessage?.text) {
        await client.sendMessage(botJid, {
          text: `${notification}\nDeleted message: ${deletedMessage.message.extendedTextMessage.text}`,
          mentions: [sender]
        });
      }

    } catch (error) {
      console.error('AntiDelete error:', error);
    }
  }
};

module.exports.storeMessage = (store, m) => {
  if (!m || !m.key || !m.message) return;

  const remoteJid = m.key.remoteJid;
  if (!store.chats[remoteJid]) {
    store.chats[remoteJid] = [];
  }

  store.chats[remoteJid].push(m);
  
  if (store.chats[remoteJid].length > 100) {
    store.chats[remoteJid].shift();
  }
};