const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs');
const path = require('path');
const { getCommands } = require('./Handler/toxic'); // Adjust path to your command loader
const EDLz = require('./Handler/eventHandler2'); // From previous context

const logger = P({ level: 'silent' }); // Suppress Baileys verbose logs

async function startToxicMD() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  const client = makeWASocket({ logger, printQRInTerminal: true, auth: state });

  client.public = true; // Allow group commands (adjust based on your mode logic)
  client.ev.on('creds.update', saveCreds);

  client.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.error('Toxic-MD: Connection closed:', lastDisconnect?.error?.message || 'Unknown error');
      if (shouldReconnect) startToxicMD();
    } else if (connection === 'open') {
      console.log('Toxic-MD: Connected 😈');
    }
  });

  client.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const m = messages[0];
      if (!m.message) return;

      const commands = await getCommands();
      const context = {
        client,
        m,
        mode: client.public ? 'public' : 'private',
        pict: fs.readFileSync(path.join(__dirname, 'xh_clinton', 'toxic.jpg')),
        botname: 'Toxic-MD 😈',
        prefix: '.' // Match your database prefix
      };

      // Handle button clicks (interactive messages)
      if (m.message.interactiveMessage || m.message.listResponseMessage) {
        const selected = m.message.listResponseMessage?.singleSelectReply?.selectedRowId;
        if (selected) {
          const cmd = commands.find((c) => c.name === selected.split('!')[1]);
          if (cmd) await cmd.run(context);
        }
        return;
      }

      // Handle text commands
      const body = m.message.conversation || m.message.extendedTextMessage?.text;
      if (!body || !body.startsWith(context.prefix)) return;

      const command = body.slice(context.prefix.length).trim().split(/ +/).shift().toLowerCase();
      const cmd = commands.find((c) => c.name === command || c.aliases?.includes(command));
      if (cmd) {
        await cmd.run({ ...context, text: body.slice(context.prefix.length + command.length).trim() });
      }
    } catch (err) {
      console.error('Toxic-MD: Error in messages.upsert:', err.message);
    }
  });

  client.ev.on('group-participants.update', async (update) => {
    try {
      await EDLz(client, update);
    } catch (err) {
      console.error('Toxic-MD: Error in group-participants.update:', err.message);
    }
  });

  return client;
}

startToxicMD().catch((err) => console.error('Toxic-MD: Startup error:', err.message));