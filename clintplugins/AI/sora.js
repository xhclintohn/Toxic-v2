const fetch = require('node-fetch');

/**
 * Generates a video using Sora AI based on the provided prompt.
 * @module sora
 */
module.exports = {
  name: 'sora',
  aliases: ['soraai', 'genvideo'],
  description: 'Generates a video using Sora AI with your text prompt',
  run: async (context) => {
    const { client, m, prefix, botname } = context;

    try {
      /**
       * Ensures a prompt is provided.
       */
      const prompt = m.body.replace(new RegExp(`^${prefix}(sora|soraai|genvideo)\\s*`, 'i'), '').trim();
      if (!prompt) {
        return client.sendMessage(m.chat, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, @${m.sender.split('@')[0]}! 😤 You forgot the prompt, dumbass!\n│❒ Example: ${prefix}sora A blue cat dancing in space\n┗━━━━━━━━━━━━━━━┛`,
          mentions: [m.sender]
        }, { quoted: m });
      }

      /**
       * Sends a "generating" loading message.
       */
      const loadingMsg = await client.sendMessage(m.chat, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Generating your Sora video...\n│❒ *"${prompt}"*\n│❒ Hold tight, this might take a sec! ⏳\n┗━━━━━━━━━━━━━━━┛`
      }, { quoted: m });

      /**
       * Calls the new Sora AI API.
       */
      const apiUrl = `https://anabot.my.id/api/ai/sora?prompt=${encodeURIComponent(prompt)}&apikey=freeApikey`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!data.success || !data.data?.result?.url) {
        throw new Error(data.message || 'Failed to generate video');
      }

      const videoUrl = data.data.result.url;

      /**
       * Sends the generated video.
       */
      await client.sendMessage(m.chat, {
        video: { url: videoUrl },
        caption: `◈━━━━━━━━━━━━━━━━◈\n│❒ *Sora AI Video Generated!*\n│❒ Prompt: _${prompt}_\n│❒ Powered by *${botname}*\n┗━━━━━━━━━━━━━━━┛`,
        gifPlayback: false
      }, { quoted: m });

      /**
       * Deletes the loading message.
       */
      await client.sendMessage(m.chat, { delete: loadingMsg.key });

    } catch (error) {
      console.error('Sora command error:', error);
      await client.sendMessage(m.chat, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke, @${m.sender.split('@')[0]}! 😤 Couldn't generate the video.\n│❒ Error: ${error.message}\n┗━━━━━━━━━━━━━━━┛`,
        mentions: [m.sender]
      }, { quoted: m });
    }
  }
};