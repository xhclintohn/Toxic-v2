const { getSettings, updateSetting } = require('../../Database/config');
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { m, args } = context;
        const value = args[0]?.toLowerCase();

        let settings = await getSettings();
        
        // Set default value to 'on' (true) if not exists
        if (typeof settings.autoview === 'undefined') {
            await updateSetting('autoview', 'true');
            settings.autoview = true;
        }

        if (value === 'on') {
            if (settings.autoview) {
                return await m.reply('◈━━━━━━━━━━━━━━━━◈\n│❒ ✅ Autoview is already ON.\n◈━━━━━━━━━━━━━━━━◈');
            }
            await updateSetting('autoview', 'true');
            await m.reply('◈━━━━━━━━━━━━━━━━◈\n│❒ ✅ Autoview has been turned ON.\n│❒ The bot will now automatically view status updates.\n◈━━━━━━━━━━━━━━━━◈');
        } else if (value === 'off') {
            if (!settings.autoview) {
                return await m.reply('◈━━━━━━━━━━━━━━━━◈\n│❒ ❌ Autoview is already OFF.\n◈━━━━━━━━━━━━━━━━◈');
            }
            await updateSetting('autoview', 'false');
            await m.reply('◈━━━━━━━━━━━━━━━━◈\n│❒ ❌ Autoview has been turned OFF.\n◈━━━━━━━━━━━━━━━━◈');
        } else {
            await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ 📄 Current autoview setting: ${settings.autoview ? 'ON' : 'OFF'}\n│❒ \n│❒ Use _${settings.prefix}autoview on_ or _${settings.prefix}autoview off_.\n◈━━━━━━━━━━━━━━━━◈`);
        }
    });
};