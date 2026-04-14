const { getFakeQuoted } = require('../../lib/fakeQuoted');

  module.exports = {
      name: 'listonline',
      aliases: ['onlinelist', 'whosonline', 'online'],
      description: 'List group members who are currently online',
      run: async (context) => {
          const { client, m, isGroup } = context;
          const fq = getFakeQuoted(m);
          if (!isGroup) {
              return client.sendMessage(m.chat, {
                  text: '╭───(    TOXIC-MD    )───\n├───≫ Oɴʟɪɴᴇ Lɪsᴛ ≪───\n├\n├ This only works in groups, genius.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧'
              }, { quoted: fq });
          }
          try {
              await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });
              const meta = await client.groupMetadata(m.chat);
              const participants = meta.participants || [];
              const onlineList = [];
              for (const p of participants.slice(0, 20)) {
                  const pJid = (p.jid && !p.jid.endsWith('@lid'))
                      ? p.jid
                      : (p.id && !p.id.endsWith('@lid') ? p.id : null);
                  if (!pJid) continue;
                  try {
                      const status = await client.fetchStatus(pJid).catch(() => null);
                      if (status?.status?.includes('online') || status?.setAt?.getTime() > Date.now() - 5 * 60 * 1000) {
                          onlineList.push(pJid);
                      }
                  } catch {}
              }
              await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
              const body = onlineList.length > 0
                  ? onlineList.map((j, i) => `├ [${i+1}] @${j.split('@')[0]}`).join('\n')
                  : '├ Nobody is online right now. Dead group.';
              return client.sendMessage(m.chat, {
                  text: `╭───(    TOXIC-MD    )───\n├───≫ Oɴʟɪɴᴇ Mᴇᴍʙᴇʀs ≪───\n├\n${body}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                  mentions: onlineList
              }, { quoted: fq });
          } catch {
              await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
              return client.sendMessage(m.chat, { text: '╭───(    TOXIC-MD    )───\n├───≫ Oɴʟɪɴᴇ Lɪsᴛ ≪───\n├\n├ Couldn\'t fetch online members.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧' }, { quoted: fq });
          }
      }
  };
