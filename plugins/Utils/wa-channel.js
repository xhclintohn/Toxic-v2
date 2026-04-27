import fetch from 'node-fetch';
import { getFakeQuoted } from '../../lib/fakeQuoted.js';
/* 
export default {
    name: "wa-channel",
    aliases: ["channel", "channelstalk"], 
    run: async ({ client, m, text }) => {

try {
if (!text) return m.reply('Provide a WhatsApp channel link to stalk');


if (!text.includes('whatsapp.com/channel')) {
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
        return m.reply(`Doesnt look like a WhatsApp channel link, uh?`);
    }

await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });
const response = await fetch(`https:

const data = await response.json()

const img = data.data.img;
const name = data.data.title

await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });
await client.sendMessage(m.chat, { image: { url: img}, caption: `Channel Name:- ${data.data.title}\n\nFollowers:- ${data.data.followers}\n\nDescription:- ${data.data.description}`}, { quoted: fq })

} catch (error) {
    await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});

m.reply("Error occured\n" + error)

}

}

}

*/