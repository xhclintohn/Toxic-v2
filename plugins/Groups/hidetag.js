const middleware = require('../../utils/botUtil/middleware');
const { getFakeQuoted } = require('../../lib/fakeQuoted');

module.exports = async (context) => {
    await middleware(context, async () => {
        const { client, m, args, participants, text } = context;
        const fq = getFakeQuoted(m);

await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });
await client.sendMessage(m.chat, { text : text ? text : 'ᅠᅠᅠᅠ' , mentions: participants.map(a => a.id)}, { quoted: fq });
await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

});

}

