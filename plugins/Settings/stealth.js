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
            const isEnabled = settings.stealth === 'true' || settings.stealth === true;
            const value = args[0]?.toLowerCase();

            if (value === 'on') {
                if (isEnabled) return await client.sendMessage(m.chat, { text: fmt('Stealth is already ON, dummy. 😒 Bot is already ghosting.') }, { quoted: fq });
                await updateSetting('stealth', 'true');
                await client.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } });
                return await client.sendMessage(m.chat, { text: fmt('👻 Stealth ON! Commands and replies auto-delete after 8s. Ghost mode activated. 😈') }, { quoted: fq });
            }

            if (value === 'off') {
                if (!isEnabled) return await client.sendMessage(m.chat, { text: fmt('Stealth is already OFF, clown. 🙄 Nothing to disable.') }, { quoted: fq });
                await updateSetting('stealth', 'false');
                await client.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } });
                return await client.sendMessage(m.chat, { text: fmt('💡 Stealth OFF. Replies stay visible now. Boring choice but alright.') }, { quoted: fq });
            }

            await client.sendMessage(m.chat, {
                text: fmt(`Stealth Mode: *${isEnabled ? 'ON 👻' : 'OFF 💡'}*\n├ Usage: *${prefix}stealth on/off*\n├ When ON, bot auto-deletes commands + replies after 8s.`),
                buttons: [
                    { buttonId: `${prefix}stealth on`, buttonText: { displayText: 'ON 👻' }, type: 1 },
                    { buttonId: `${prefix}stealth off`, buttonText: { displayText: 'OFF 💡' }, type: 1 },
                ],
                headerType: 1,
                viewOnce: true,
            }, { quoted: fq });
        } catch (err) {
            await client.sendMessage(m.chat, { text: fmt(`Crashed. 💀 Error: ${err.message}`) }, { quoted: fq });
        }
    });
};
