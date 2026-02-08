const middleware = require('../../utility/botUtil/middleware');

module.exports = async (context) => {
    await middleware(context, async () => {
        const { client, m } = context;

        await client.groupSettingUpdate(m.chat, 'announcement');
                m.reply('╭───(    `𝐓𝐨𝐱𝐢𝐜-𝐌D`    )───\n`々` Group closed.\n╭───(    `𝐓𝐨𝐱𝐢𝐜-𝐌D`    )───');
    });
};