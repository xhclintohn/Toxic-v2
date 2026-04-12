const { getSettings, updateSetting } = require('../../database/config');
const { getFakeQuoted } = require('../../lib/fakeQuoted');

const DEV_NUMBER = '254114885159';

module.exports = {
    name: 'toxicai',
    aliases: ['devai', 'toxicagent'],
    description: 'Toggle ToxicAgent GitHub AI (dev only)',
    run: async (context) => {
        const { client, m, args, prefix } = context;
        const fq = getFakeQuoted(m);

        const senderNum = (m.sender || '').split('@')[0].split(':')[0];
        const fmt = (title, lines) => {
            const body = (Array.isArray(lines) ? lines : [lines]).map(l => `├ ${l}`).join('\n');
            return `╭───(    TOXIC-MD    )───\n├───≫ ${title} ≪───\n├\n${body}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
        };

        if (senderNum !== DEV_NUMBER) {
            return client.sendMessage(m.chat, {
                text: fmt('TOXICAGENT', ['Access denied.', 'Dev-only feature. Not your toy.'])
            }, { quoted: fq });
        }

        try {
            const settings = await getSettings();
            const value = (args[0] || '').toLowerCase();

            if (value === 'on' || value === 'off') {
                const newState = value === 'on';
                await updateSetting('toxicagent', newState);
                await client.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } });
                return client.sendMessage(m.chat, {
                    text: fmt('TOXICAGENT', newState
                        ? ['Status: ✅ ON', 'GitHub AI agent active. Just text me GitHub tasks.']
                        : ['Status: ❌ OFF', 'GitHub AI disabled.'])
                }, { quoted: fq });
            }

            const isOn = settings.toxicagent === true || settings.toxicagent === 'true';
            return client.sendMessage(m.chat, {
                text: fmt('TOXICAGENT', [
                    `Status: ${isOn ? '✅ ON' : '❌ OFF'}`,
                    'Handles: create/delete/rename repos, upload files,',
                    '         list branches, create issues, star repos',
                    '',
                    `Toggle: ${prefix}toxicai on  /  ${prefix}toxicai off`,
                    'Say "clear conversation" to reset memory'
                ])
            }, { quoted: fq });
        } catch {
            client.sendMessage(m.chat, { text: fmt('TOXICAGENT', 'something broke. try again.') }, { quoted: fq });
        }
    }
};
