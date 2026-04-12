const middleware = require('../../utils/botUtil/middleware');

module.exports = async (context) => {
    await middleware(context, async () => {
        const { client, m, args, participants, text } = context;

await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });
await client.sendMessage(m.chat, { text : text ? text : 'ᅠᅠᅠᅠ' , mentions: participants.map(a => a.id)}, { quoted: m });
await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

});

}

