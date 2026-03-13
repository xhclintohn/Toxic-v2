const middleware = require('../../utils/botUtil/middleware');

module.exports = async (context) => {
    await middleware(context, async () => {
        const { client, m, text, prefix, pict } = context;

        const args = text.trim().split(/ +/);
        const command = args[0]?.toLowerCase() || '';
        const newText = args.slice(1).join(' ').trim();

        switch (command) {
            case 'setgroupname':
                if (!newText) return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ USAGE ≪───\n├ \n├ Yo, give me a new group name!\n├ Usage: ${prefix}setgroupname <new name>\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
                if (newText.length > 100) return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Group name can't be longer\n├ than 100 characters, genius!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

                try {
                    await client.groupUpdateSubject(m.chat, newText);
                    await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ UPDATED ≪───\n├ \n├ Group name slammed to "${newText}"!\n├ Let's keep the chaos going!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`, {
                        contextInfo: {
                            externalAdReply: {
                                title: `Toxic-MD`,
                                body: `Group Update`,
                                previewType: "PHOTO",
                                thumbnail: pict,
                                sourceUrl: 'https://github.com/xhclintohn/Toxic-MD'
                            }
                        }
                    });
                } catch (error) {
                    console.error('Error updating group subject:', error);
                    await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ FAILED ≪───\n├ \n├ Failed to update group name.\n├ WhatsApp's acting up, not me!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
                }
                break;

            case 'setgroupdesc':
                if (!newText) return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ USAGE ≪───\n├ \n├ Gimme a new description!\n├ Usage: ${prefix}setgroupdesc <new description>\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

                try {
                    await client.groupUpdateDescription(m.chat, newText);
                    await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ UPDATED ≪───\n├ \n├ Group description updated!\n├ Time to flex that new vibe!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`, {
                        contextInfo: {
                            externalAdReply: {
                                title: `Toxic-MD`,
                                body: `Group Update`,
                                previewType: "PHOTO",
                                thumbnail: pict,
                                sourceUrl: 'https://github.com/xhclintohn/Toxic-MD'
                            }
                        }
                    });
                } catch (error) {
                    console.error('Error updating group description:', error);
                    await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ FAILED ≪───\n├ \n├ Couldn't update the description.\n├ Blame WhatsApp's nonsense!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
                }
                break;

            case 'setgrouprestrict':
                const action = newText.toLowerCase();
                if (!['on', 'off'].includes(action)) return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ USAGE ≪───\n├ \n├ Usage: ${prefix}setgrouprestrict <on|off>\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

                try {
                    const restrict = action === 'on';
                    await client.groupSettingUpdate(m.chat, restrict ? 'locked' : 'unlocked');
                    await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ UPDATED ≪───\n├ \n├ Group editing is now\n├ ${restrict ? 'locked to admins only' : 'open to all members'}!\n├ Keep it toxic!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`, {
                        contextInfo: {
                            externalAdReply: {
                                title: `Toxic-MD`,
                                body: `Group Update`,
                                previewType: "PHOTO",
                                thumbnail: pict,
                                sourceUrl: 'https://github.com/xhclintohn/Toxic-MD'
                            }
                        }
                    });
                } catch (error) {
                    console.error('Error updating group settings:', error);
                    await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ FAILED ≪───\n├ \n├ Failed to update group settings.\n├ WhatsApp's tripping again!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
                }
                break;

            default:
                await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ INVALID ≪───\n├ \n├ Invalid groupmeta command!\n├ Use ${prefix}setgroupname,\n├ ${prefix}setgroupdesc, or\n├ ${prefix}setgrouprestrict\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
    });
};
