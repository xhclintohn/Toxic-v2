const { getSettings, updateSetting } = require('../../Database/config');
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { m, args } = context;
        const value = args[0]?.toLowerCase();

        let settings = await getSettings();
        const prefix = settings.prefix;
        
        // Set default value to false if not exists
        if (typeof settings.anticall === 'undefined') {
            await updateSetting('anticall', false);
            settings.anticall = false;
        }
        
        let isEnabled = settings.anticall === true;

        if (value === 'on' || value === 'off') {
            const action = value === 'on';

            if (isEnabled === action) {
                return await m.reply('◈━━━━━━━━━━━━━━━━◈\n│❒ ✅ Anti-call is already ' + value.toUpperCase() + '.\n◈━━━━━━━━━━━━━━━━◈');
            }

            await updateSetting('anticall', action ? true : false);
            await m.reply('◈━━━━━━━━━━━━━━━━◈\n│❒ ✅ Anti-call has been turned ' + value.toUpperCase() + '.\n◈━━━━━━━━━━━━━━━━◈');
        } else {
            await m.reply(
                '◈━━━━━━━━━━━━━━━━◈\n' +
                `│❒ 📄 Current Anti-call setting: ${isEnabled ? 'ON' : 'OFF'}\n` +
                '│❒ \n' +
                `│❒ Use "${prefix}anticall on" or "${prefix}anticall off" to change it._\n` +
                '◈━━━━━━━━━━━━━━━━◈'
            );
        }
    });
};