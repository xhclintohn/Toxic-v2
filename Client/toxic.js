const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs');
const path = require('path');
const { getCommands } = require('./Handler/toxic');
const EDLz = require('./Handler/eventHandler2');

const logger = P({ level: 'silent' });

async function startToxicMD() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  const client = makeWASocket({ logger, printQRInTerminal: true, auth: state });

  client.public = true; // Allow group commands
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
      if (!m.message) {
        console.log('Toxic-MD: No message content, skipping');
        return;
      }

      const commands = await getCommands();
      console.log(`Toxic-MD: Loaded ${commands.length} commands: ${commands.map((c) => c.name).join(', ')}`);

      const context = {
        client,
        m,
        mode: client.public ? 'public' : 'private',
        pict: fs.existsSync(path.join(__dirname, 'xh_clinton', 'toxic.jpg'))
          ? fs.readFileSync(path.join(__dirname, 'xh_clinton', 'toxic.jpg'))
          : null,
        botname: 'Toxic-MD 😈',
        prefix: '.', // Hardcoded fallback, overridden by commands if needed
      };

      // Handle button clicks (interactive messages)
      if (m.message.interactiveMessage || m.message.listResponseMessage) {
        const selected = m.message.listResponseMessage?.singleSelectReply?.selectedRowId;
        if (selected) {
          console.log(`Toxic-MD: Button click received: ${selected}`);
          // Try to extract command with common prefixes
          const possiblePrefixes = ['.', '#', ','];
          let command = selected;
          let matchedPrefix = null;
          for (const prefix of possiblePrefixes) {
            if (selected.startsWith(prefix)) {
              command = selected.slice(prefix.length).toLowerCase();
              matchedPrefix = prefix;
              break;
            }
          }
          const cmd = commands.find((c) => c.name === command || c.aliases?.includes(command));
          if (cmd) {
            console.log(`Toxic-MD: Executing button command: ${command} (prefix: ${matchedPrefix || 'none'})`);
            await cmd.run(context);
          } else {
            console.warn(`Toxic-MD: No command found for button: ${command}`);
            await client.sendMessage(
              m.chat,
              {
                text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, moron! 😈 No command named "${command}" exists. Pick a real one, loser. 🖕\n┗━━━━━━━━━━━━━━━┛`,
              },
              { quoted: m, ad: true }
            );
          }
        } else {
          console.log('Toxic-MD: Button click received but no selectedRowId');
        }
        return;
      }

      // Handle text commands
      const body = m.message.conversation || m.message.extendedTextMessage?.text || '';
      console.log(`Toxic-MD: Message body: ${body}`);
      const possiblePrefixes = ['.', '#', ','];
      let command = null;
      let args = [];
      let matchedPrefix = null;

      for (const prefix of possiblePrefixes) {
        if (body.startsWith(prefix)) {
          matchedPrefix = prefix;
          const parts = body.slice(prefix.length).trim().split(/ +/);
          command = parts.shift().toLowerCase();
          args = parts;
          break;
        }
      }

      if (!command) {
        console.log(`Toxic-MD: Message does not start with any prefix (${possiblePrefixes.join(', ')}), ignoring`);
        return;
      }

      console.log(`Toxic-MD: Parsed command: ${command}, args: ${args.join(' ')}, prefix: ${matchedPrefix}`);
      const cmd = commands.find((c) => c.name === command || c.aliases?.includes(command));
      if (cmd) {
        console.log(`Toxic-MD: Executing text command: ${command}`);
        await cmd.run({ ...context, text: args.join(' '), args, prefix: matchedPrefix });
      } else {
        console.warn(`Toxic-MD: No command found for: ${command}`);
        await client.sendMessage(
          m.chat,
          {
            text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, dumbass! 😈 "${command}" ain't a command. Try ${matchedPrefix}menu, loser. 🖕\n┗━━━━━━━━━━━━━━━┛`,
          },
          { quoted: m, ad: true }
        );
      }
    } catch (err) {
      console.error('Toxic-MD: Error in messages.upsert:', err.stack);
      await client.sendMessage(
        m.chat,
        {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke, moron! 😈 Error: ${err.message}. Try again later. 💀\n┗━━━━━━━━━━━━━━━┛`,
        },
        { quoted: m, ad: true }
      );
    }
  });

  client.ev.on('group-participants.update', async (update) => {
    try {
      await EDLz(client, update);
    } catch (err) {
      console.error('Toxic-MD: Error in group-participants.update:', err.stack);
    }
  });

  return client;
}

startToxicMD().catch((err) => console.error('Toxic-MD: Startup error:', err.stack));