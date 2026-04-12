function makeFakeQuoted(m) {
      return {
          key: {
              participant: m.key?.participant || m.key?.remoteJid,
              remoteJid: m.key?.remoteJid,
              fromMe: m.key?.fromMe || false,
              id: m.key?.id || m.id || 'toxic-fq'
          },
          message: m.message || { conversation: m.body || m.text || '✓' }
      };
  }

  module.exports = { makeFakeQuoted };
  