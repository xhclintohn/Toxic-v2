const { getSettings, updateSetting } = require('../../database/config');
const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

module.exports = {
    name: 'toxicai',
    aliases: ['toxicagent', 'devai'],
    description: 'Toggle ToxicAI developer GitHub agent (dev only)',
    run: async (context) => {
        await ownerMiddleware(context, async () => {
            const { client, m, args, prefix } = context;

            const DEV_NUMBER = '254114885159';
            const senderNum = (m.sender || '').split('@')[0].split(':')[0];

            if (senderNum !== DEV_NUMBER) {
                return await client.sendMessage(m.chat, {
                    text: `╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ This command is for the developer only.\n├ You are not them.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
                }, { quoted: m });
            }

            const fmt = (title, message) => `╭───(    TOXIC-MD    )───\n├───≫ ${title} ≪───\n├ \n├ ${message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

            try {
                const settings = await getSettings();
                const value = args[0]?.toLowerCase();

                if (value === 'on' || value === 'off') {
                    const newState = value === 'on';
                    if (settings.toxicai === newState) {
                        return await client.sendMessage(m.chat, {
                            text: fmt('TOXIC AI', `ToxicAI is already ${value.toUpperCase()}.`)
                        }, { quoted: m });
                    }
                    await updateSetting('toxicai', newState);
                    await client.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } });
                    return await client.sendMessage(m.chat, {
                        text: fmt('TOXIC AI', `ToxicAI ${value.toUpperCase()}! ${newState ? 'GitHub agent active. Set GITHUB_TOKEN in env vars.' : 'GitHub agent disabled.'}`)
                    }, { quoted: m });
                }

                const ghToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
                const groqKey = process.env.GROQ_API_KEY;

                return await client.sendMessage(m.chat, {
                    text: fmt('TOXIC AI', `Status: ${settings.toxicai ? 'ON ✅' : 'OFF ❌'}\n├ GROQ_API_KEY: ${groqKey ? 'set ✅' : 'not set ❌'}\n├ GITHUB_TOKEN: ${ghToken ? 'set ✅' : 'not set ❌'}\n├ \n├ When ON: I handle GitHub operations from your messages.\n├ Usage: ${prefix}toxicai on/off`)
                }, { quoted: m });

            } catch {
                await client.sendMessage(m.chat, {
                    text: fmt('TOXIC AI', 'Something broke. Try again.')
                }, { quoted: m });
            }
        });
    }
};
