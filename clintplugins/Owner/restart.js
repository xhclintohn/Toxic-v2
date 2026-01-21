const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m } = context;
        
        await client.sendMessage(m.chat, { react: { text: '🔄', key: m.key } });
        await m.reply("Restarting Toxic-MD");
        
        const { exec } = require('child_process');
        exec('heroku restart', () => {});
        
        setTimeout(() => { process.exit(0); }, 3000);
    });
};