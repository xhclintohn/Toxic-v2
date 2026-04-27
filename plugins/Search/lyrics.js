import fetch from 'node-fetch';
import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import { getFakeQuoted } from '../../lib/fakeQuoted.js';

export default async (context) => {
  const { client, m, text } = context;
  const fq = getFakeQuoted(m);
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });

  if (!text) {
    return client.sendMessage(m.chat, {
      text: '╭───(    TOXIC-MD    )───\n├ Tell me a song name you dumbass!\n├ Example: .lyrics Alone ft ava max\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧'
    }, { quoted: fq });
  }

  try {
    const encodedText = encodeURIComponent(text);
    const apiUrl = `https://api.deline.web.id/tools/lyrics?title=${encodedText}`;
    await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.status || !data.result || data.result.length === 0) {
      return client.sendMessage(m.chat, {
        text: `╭───(    TOXIC-MD    )───\n├ No lyrics found for "${text}". Maybe the song sucks.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
      }, { quoted: fq });
    }

    const song = data.result[0];
    if (!song.plainLyrics) {
      return client.sendMessage(m.chat, {
        text: '╭───(    TOXIC-MD    )───\n├ No plain lyrics for this one. Try another song, loser.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧'
      }, { quoted: fq });
    }

    const cleanLyrics = song.plainLyrics;
    const songTitle = song.trackName || song.name || 'Unknown';
    const artistName = song.artistName || 'Unknown Artist';
    const bodyText = `╭───(    TOXIC-MD    )───\n├───≫ LYRICS ≪───\n├ \n├ ${songTitle} - ${artistName}\n├ \n${cleanLyrics}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
    const copyCode = `${songTitle} - ${artistName}\n\n${cleanLyrics}`.slice(0, 4096);

    try {
      const msg = generateWAMessageFromContent(
        m.chat,
        {
          interactiveMessage: {
            body: { text: bodyText },
            footer: { text: `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧` },
            nativeFlowMessage: {
              buttons: [
                {
                  name: 'cta_copy',
                  buttonParamsJson: JSON.stringify({
                    display_text: '📋 Copy Lyrics',
                    copy_code: copyCode
                  })
                }
              ]
            }
          }
        },
        { quoted: fq }
      );
      await client.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    } catch {
      await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });
      await client.sendMessage(m.chat, { text: bodyText }, { quoted: fq });
    }
  } catch (error) {
    await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
    await client.sendMessage(m.chat, {
      text: `╭───(    TOXIC-MD    )───\n├───≫ LYRICS ERROR ≪───\n├ \n├ Can't get lyrics for "${text}". Shit broke.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
    }, { quoted: fq });
  }
};
