const { getSettings, updateSetting } = require('../../database/config');

const DEV_NUMBER = '254114885159';

module.exports = {
    name: 'toxicagent',
    aliases: ['devai', 'toxicai'],
    description: 'Toggle ToxicAgent GitHub AI (dev only)',
    run: async (context) => {
        const { client, m, args, prefix } = context;

        const senderNum = (m.sender || '').split('@')[0].split(':')[0];
        if (senderNum !== DEV_NUMBER) {
            return client.sendMessage(m.chat, { text: `╭───(    TOXIC-MD    )───\n├───≫ Aᴄᴄᴇss Dᴇɴɪᴇᴅ ≪───\n├ ToxicAgent is dev-only.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧` }, { quoted: m });
        }

        const fmt = (title, body) => `╭───(    TOXIC-MD    )───\n├───≫ ${title} ≪───\n├ \n├ ${body}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

        try {
            const settings = await getSettings();
            const value = (args[0] || '').toLowerCase();

            if (value === 'on' || value === 'off') {
                const newState = value === 'on';
                await updateSetting('toxicagent', newState);
                await client.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } });
                return client.sendMessage(m.chat, {
                    text: fmt('TOXICAGENT', `ToxicAgent ${value.toUpperCase()}! ${newState ? 'GitHub AI agent is now active. Make sure GITHUB_TOKEN is set.' : 'GitHub AI agent disabled.'}`)
                }, { quoted: m });
            }

            const ghToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
            const groqKey = process.env.GROQ_API_KEY;

            return client.sendMessage(m.chat, {
                text: fmt('TOXICAGENT', `Status: ${settings.toxicagent ? 'ON ✅' : 'OFF ❌'}\n├ GROQ_API_KEY: ${groqKey ? 'set ✅' : 'not set ❌'}\n├ GITHUB_TOKEN: ${ghToken ? 'set ✅' : 'not set ❌'}\n├ \n├ Usage: ${prefix}toxicagent on/off\n├ When ON: responds to your msgs with GitHub actions.`)
            }, { quoted: m });

        } catch {
            client.sendMessage(m.chat, { text: fmt('TOXICAGENT', 'Something broke. Try again.') }, { quoted: m });
        }
    }
};
