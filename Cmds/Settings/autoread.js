const { getSettings, updateSetting } = require('../../Database/config');
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { m, args } = context;
        const value = args[0]?.toLowerCase();

        const settings = await getSettings();
        // Set default value to 'off' if not exists
        if (typeof settings.autoread === 'undefined') {
            await updateSetting('autoread', 'false');
            settings.autoread = false;
        }

        if (value === 'on') {
            if (settings.autoread) {
                return await m.reply('◈━━━━━━━━━━━━━━━━◈\n│❒ ✅ Autoread is already ON.\n◈━━━━━━━━━━━━━━━━◈');
            }
            await updateSetting('autoread', 'true');
            await m.reply('◈━━━━━━━━━━━━━━━━◈\n│❒ ✅ Autoread has been turned ON.\n│❒ The bot will now automatically read messages.\n◈━━━━━━━━━━━━━━━━◈');
        } else if (value === 'off') {
            if (!settings.autoread) {
                return await m.reply('◈━━━━━━━━━━━━━━━━◈\n│❒ ❌ Autoread is already OFF.\n◈━━━━━━━━━━━━━━━━◈');
            }
            await updateSetting('autoread', 'false');
            await m.reply('◈━━━━━━━━━━━━━━━━◈\n│❒ ❌ Autoread has been turned OFF.\n◈━━━━━━━━━━━━━━━━◈');
        } else {
            await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ 📄 Current autoread setting: ${settings.autoread ? 'ON' : 'OFF'}\n│❒ \n│❒ Use _${settings.prefix}autoread on_ or _${settings.prefix}autoread off_.\n◈━━━━━━━━━━━━━━━━◈`);
        }
    });
};