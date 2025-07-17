const { getSettings, updateSetting } = require('../../Database/config');
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, prefix } = context;
        const value = context.args[0]?.toLowerCase();

        const settings = await getSettings();
        const botName = process.env.BOTNAME || settings.botname || 'Toxic-MD';
        const isEnabled = settings.antidelete === true;

        const formatStylishReply = (message) => {
            return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n┗━━━━━━━━━━━━━━━┛`;
        };

        const buttons = [
            { buttonId: `${prefix}antidelete on`, buttonText: { displayText: 'Turn ON 🗑️' }, type: 1 },
            { buttonId: `${prefix}antidelete off`, buttonText: { displayText: 'Turn OFF 🚫' }, type: 1 },
            { buttonId: `${prefix}settings`, buttonText: { displayText: 'Back to Settings ⚙️' }, type: 1 },
        ];

        let message;
        if (value === 'on' || value === 'off') {
            const action = value === 'on';
            if (isEnabled === action) {
                message = formatStylishReply(
                    `Antidelete is already ${value.toUpperCase()}! 😈\n\n` +
                    `Status: ${isEnabled ? '✅ ON' : '❌ OFF'}\n` +
                    `Use "${prefix}antidelete on" or "${prefix}antidelete off" to toggle.`
                );
            } else {
                await updateSetting('antidelete', action ? 'true' : 'false');
                message = formatStylishReply(
                    `Antidelete ${value.toUpperCase()} activated! 🔥\n\n` +
                    `Status: ${action ? '✅ ON' : '❌ OFF'}\n` +
                    `Use "${prefix}antidelete on" or "${prefix}antidelete off" to toggle.`
                );
            }
        } else {
            message = formatStylishReply(
                `Antidelete Status: ${isEnabled ? '✅ ON' : '❌ OFF'}\n\n` +
                `Use "${prefix}antidelete on" or "${prefix}antidelete off" to toggle.\n` +
                `Tap a button to configure! 😈`
            );
        }

        await client.sendMessage(
            m.chat,
            {
                text: message,
                footer: '> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ',
                buttons,
                headerType: 1,
                viewOnce: true,
            },
            { quoted: m, ad: true }
        );
    });
};
