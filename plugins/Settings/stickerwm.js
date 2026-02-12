const { getSettings, updateSetting } = require('../../database/config');
const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { m, args } = context;
        const newStickerWM = args.join(" ") || null;  

        let settings = await getSettings();

        if (!settings) {
            return await m.reply("╭───(    TOXIC-MD    )───\n├ Settings not found. Something's seriously broken.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
        }

        if (newStickerWM !== null) {
            if (newStickerWM === 'null') {
                if (!settings.packname) {
                    return await m.reply("╭───(    TOXIC-MD    )───\n├ Bot already has no sticker watermark, genius.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
                }
                await updateSetting('packname', '');
                await m.reply("╭───(    TOXIC-MD    )───\n├ Sticker watermark removed. Happy now?\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
            } else {
                if (settings.packname === newStickerWM) {
                    return await m.reply(`╭───(    TOXIC-MD    )───\n├ Watermark already set to: ${newStickerWM}\n├ Stop wasting my time.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
                }
                await updateSetting('packname', newStickerWM);
                await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ STICKER WM ≪───\n├ \n├ Watermark updated to: ${newStickerWM}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
            }
        } else {
            await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ STICKER WM ≪───\n├ \n├ Current watermark: ${settings.packname || 'None set'}\n├ \n├ Use '${settings.prefix}stickerwm null' to remove\n├ Use '${settings.prefix}stickerwm <text>' to set\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
    });
};
