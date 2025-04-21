const { getSettings, updateSetting } = require('../../Database/config');
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { m, args } = context;
        const value = args[0]?.toLowerCase();

        let settings = await getSettings();
        
        // Set default value to 'on' if not exists
        if (typeof settings.autolike === 'undefined') {
            await updateSetting('autolike', 'true');
            settings.autolike = true;
        }

        if (value === 'on') {
            if (settings.autolike) {
                return await m.reply('◈━━━━━━━━━━━━━━━━◈\n│❒ ✅ Autolike is already ON.\n◈━━━━━━━━━━━━━━━━◈');
            }
            await updateSetting('autolike', 'true');
            await m.reply('◈━━━━━━━━━━━━━━━━◈\n│❒ ✅ Autolike has been turned ON.\n│❒ The bot will now like status updates.\n◈━━━━━━━━━━━━━━━━◈');
        } else if (value === 'off') {
            if (!settings.autolike) {
                return await m.reply('◈━━━━━━━━━━━━━━━━◈\n│❒ ❌ Autolike is already OFF.\n◈━━━━━━━━━━━━━━━━◈');
            }
            await updateSetting('autolike', 'false');
            await m.reply('◈━━━━━━━━━━━━━━━━◈\n│❒ ❌ Autolike has been turned OFF.\n◈━━━━━━━━━━━━━━━━◈');
        } else {
            await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ 📄 Current autolike setting: ${settings.autolike ? 'ON' : 'OFF'}\n│❒ \n│❒ Use _${settings.prefix}autolike on_ or _${settings.prefix}autolike off_.\n◈━━━━━━━━━━━━━━━━◈`);
        }
    });
};