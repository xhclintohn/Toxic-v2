import ownerMiddleware from '../../utils/botUtil/Ownermiddleware.js';
import { getFakeQuoted } from '../../lib/fakeQuoted.js';
/* import { getSettings, updateSetting } from '../../config.js';

export default async (context) => {
    await ownerMiddleware(context, async () => {
        const { m, args } = context;
        const fq = getFakeQuoted(m);
        const newPrefix = args[0];

        let settings = await getSettings();

        if (newPrefix === 'null') {
            if (!settings.prefix) {
                await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });
                return await m.reply(`✅ The bot was already prefixless.`);
            }
            await updateSetting('prefix', '');
            await m.reply(`✅ The bot is now prefixless.`);
        } else if (newPrefix) {
            if (settings.prefix === newPrefix) {
                return await m.reply(`✅ The prefix was already set to: ${newPrefix}`);
            }
            await updateSetting('prefix', newPrefix);
            await m.reply(`✅ Prefix has been updated to: ${newPrefix}`);
        } else {
            await m.reply(`📄 Current prefix: ${settings.prefix || 'No prefix set.'}\n\nUse _prefix null_ to remove the prefix or _prefix <any symbol>_ to set a specific prefix.`);
        }
    });
};

*/