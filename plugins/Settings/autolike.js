import { getSettings, updateSetting } from '../../database/config.js';
import ownerMiddleware from '../../utils/botUtil/Ownermiddleware.js';
import { getFakeQuoted } from '../../lib/fakeQuoted.js';

export default async (context) => {
  await ownerMiddleware(context, async () => {
    const { client, m, args } = context;
    const fq = getFakeQuoted(m);

    try {
      const settings = await getSettings();
      const prefix = settings.prefix || '.';
      const value = args[0]?.toLowerCase();

      if (value === 'on' || value === 'off') {
        const newValue = value === 'on';

        if (settings.autolike === newValue) {
          await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });
          await m.reply(
            `╭───(    TOXIC-MD    )───\n` +
            `├───≫ AUTOLIKE ≪───\n` +
            `├ \n` +
            `├ Autolike is already ${value.toUpperCase()}, you brain-dead fool!\n` +
            `╰──────────────────☉\n` +
            `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
          );
          return;
        }

        await updateSetting('autolike', newValue);
        await client.sendMessage(m.chat, { react: { text: '⚙️', key: m.reactKey } });

        await m.reply(
          `╭───(    TOXIC-MD    )───\n` +
          `├───≫ AUTOLIKE ≪───\n` +
          `├ \n` +
          `├ Autolike ${value.toUpperCase()}! ${value === 'on' ? 'Bot will now like statuses!' : 'Bot will ignore statuses like they ignore you.'}\n` +
          `╰──────────────────☉\n` +
          `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        );
        return;
      }

    
      const isAutolikeOn = settings.autolike === true;
      const currentEmoji = settings.autolikeemoji || 'random';
      
      const statusText = isAutolikeOn ? 
                        `ON (${currentEmoji === 'random' ? 'Random emojis' : currentEmoji + ' emoji'})` : 
                        'OFF';

      await client.sendMessage(m.chat, {
        interactiveMessage: {
          header: `╭───(    TOXIC-MD    )───\n├───≫ AUTOLIKE ≪───\n├ \n├ Current: ${statusText}\n├ \n├ Use "${prefix}autolike on" to turn ON\n├ Use "${prefix}autolike off" to turn OFF\n├ Use "${prefix}reaction <emoji>" to change emoji\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
          buttons: [
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "TURN ON",
                id: `${prefix}autolike on`
              })
            },
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "TURN OFF",
                id: `${prefix}autolike off`
              })
            }
          ]
        }
      }, { quoted: fq });

    } catch (error) {
      console.error('Autolike command error:', error);
      await m.reply(
        `╭───(    TOXIC-MD    )───\n` +
        `├───≫ AUTOLIKE ≪───\n` +
        `├ \n` +
        `├ Failed to update autolike. Database might be drunk.\n` +
        `╰──────────────────☉\n` +
        `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
      );
    }
  });
};
