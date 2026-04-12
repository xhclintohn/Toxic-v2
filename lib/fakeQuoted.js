/**
   * Shared fakeQuoted utility for Toxic-MD
   * Usage: const { getFakeQuoted } = require('../../lib/fakeQuoted');
   *        const fq = getFakeQuoted(m);
   *        client.sendMessage(m.chat, { text }, { quoted: fq });
   */

  function getFakeQuoted(m) {
      return {
          key: {
              participant: '0@s.whatsapp.net',
              remoteJid: '0@s.whatsapp.net',
              id: m?.id || m?.key?.id || '0',
          },
          message: {
              conversation: 'Toxic',
          },
          contextInfo: {
              mentionedJid: [m?.sender || m?.key?.participant || ''],
              forwardingScore: 999,
              isForwarded: true,
          },
      };
  }

  module.exports = { getFakeQuoted };
  