const { getSettings, updateSetting } = require('../../database/config');
const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');
const { getFakeQuoted } = require('../../lib/fakeQuoted');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, args, prefix } = context;
        const fq = getFakeQuoted(m);

        const fmt = (msg) => `╭───(    TOXIC-MD    )───\n├ ${msg}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

        try {
            const settings = await getSettings();
            const isEnabled = settings.multiprefix === 'true' || settings.multiprefix === true;
            const value = args[0]?.toLowerCase();

            if (value === 'on' || value === 'all') {
                if (isEnabled) return await client.sendMessage(m.chat, { text: fmt('Multi-prefix is already ON, genius. 😒 All symbols already work.') }, { quoted: fq });
                await updateSetting('multiprefix', 'true');
                await client.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } });
                return await client.sendMessage(m.chat, { text: fmt('🔥 Multi-prefix ON! Bot now responds to . ! # / $ ? + - * ~ @ % and even null prefix. Pure chaos. 😈') }, { quoted: fq });
            }

            if (value === 'off') {
                if (!isEnabled) return await client.sendMessage(m.chat, { text: fmt(`Multi-prefix already OFF, clown. 🙄 Single prefix: *${settings.prefix || '.'}*`) }, { quoted: fq });
                await updateSetting('multiprefix', 'false');
                await client.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } });
                return await client.sendMessage(m.chat, { text: fmt(`🧊 Multi-prefix OFF. Back to single prefix: *${settings.prefix || '.'}*`) }, { quoted: fq });
            }

            await client.sendMessage(m.chat, {
                text: fmt(`Multi-Prefix: *${isEnabled ? 'ON 🔥 — all symbols active' : `OFF 🧊 — using: ${settings.prefix || '.'}`}*\n├ Usage: *${prefix}multiprefix on/off*\n├ When ON, bot accepts any prefix symbol or none at all.`),
                buttons: [
                    { buttonId: `${prefix}multiprefix on`, buttonText: { displayText: 'ON 🔥' }, type: 1 },
                    { buttonId: `${prefix}multiprefix off`, buttonText: { displayText: 'OFF 🧊' }, type: 1 },
                ],
                headerType: 1,
                viewOnce: true,
            }, { quoted: fq });
        } catch (err) {
            await client.sendMessage(m.chat, { text: fmt(`Exploded. 💀 Error: ${err.message}`) }, { quoted: fq });
        }
    });
};
