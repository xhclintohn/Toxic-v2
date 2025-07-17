const { getSettings, updateSetting } = require('../../Database/config');
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
  await ownerMiddleware(context, async () => {
    const { m, args, client } = context;
    const value = args[0]?.toLowerCase();

    let settings = await getSettings();
    const prefix = settings.prefix;
    let isEnabled = settings.chatbotpm === true;

    if (value === 'on' || value === 'off') {
      const action = value === 'on';

      if (isEnabled === action) {
        return await m.reply(
          `◈━━━━━━━━━━━━━━━━◈\n` +
          `│❒ Yo, genius! 😈 Chatbot PM is already ${value.toUpperCase()}!\n` +
          `│❒ Stop wasting my time, moron. 🖕\n` +
          `┗━━━━━━━━━━━━━━━┛`
        );
      }

      await updateSetting('chatbotpm', action ? true : false);
      await m.reply(
        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ Chatbot PM ${value.toUpperCase()} activated! 🔥\n` +
        `│❒ Non-sudo users will ${action ? 'get AI replies!' : 'be ignored!'}\n` +
        `┗━━━━━━━━━━━━━━━┛`,
        null,
        {
          buttons: [
            { buttonId: `${prefix}chatbotpm on`, buttonText: { displayText: 'Turn ON' }, type: 1 },
            { buttonId: `${prefix}chatbotpm off`, buttonText: { displayText: 'Turn OFF' }, type: 1 },
            { buttonId: `${prefix}settings`, buttonText: { displayText: 'Back to Settings' }, type: 1 }
          ],
          headerType: 1
        }
      );
    } else {
      await m.reply(
        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ Chatbot PM Status: ${isEnabled ? 'ON 🥶' : 'OFF 😴'}\n` +
        `│❒ Use "${prefix}chatbotpm on" or "${prefix}chatbotpm off", you noob!\n` +
        `┗━━━━━━━━━━━━━━━┛`,
        null,
        {
          buttons: [
            { buttonId: `${prefix}chatbotpm on`, buttonText: { displayText: 'Turn ON' }, type: 1 },
            { buttonId: `${prefix}chatbotpm off`, buttonText: { displayText: 'Turn OFF' }, type: 1 },
            { buttonId: `${prefix}settings`, buttonText: { displayText: 'Back to Settings' }, type: 1 }
          ],
          headerType: 1
        }
      );
    }
  });
};
