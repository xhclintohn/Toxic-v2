const fetch = require('node-fetch');

module.exports = {
  name: 'sora',
  aliases: ['soraai', 'genvideo'],
  description: 'Generates a video using Sora AI with your text prompt',
  run: async (context) => {
    const { client, m, prefix } = context;

    const prompt = m.body.replace(new RegExp(`^${prefix}(sora|soraai|genvideo)\\s*`, 'i'), '').trim();
    if (!prompt) {
      return client.sendMessage(m.chat, {
        text: `╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Yo, @${m.sender.split('@')[0]}! You forgot the prompt!\n├ Example: ${prefix}sora a cat dancing in space\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
        mentions: [m.sender]
      }, { quoted: m });
    }

    try {
      await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

      const params = new URLSearchParams({
        apikey: 'fgsiapi-2dcdfa06-6d',
        prompt: prompt,
        ratio: 'landscape',
        enhancePrompt: 'true'
      });

      const response = await fetch(`https://fgsi.dpdns.org/api/ai/sora2?${params.toString()}`, {
        headers: { 'accept': 'application/json' }
      });

      const data = await response.json();
      
      if (!data.status || !data.data?.pollUrl) {
        throw new Error('Failed to start video generation');
      }

      const pollUrl = data.data.pollUrl;
      let videoUrl = null;
      let attempts = 0;
      const maxAttempts = 60;

      while (attempts < maxAttempts && !videoUrl) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 3000));

        try {
          const pollResponse = await fetch(pollUrl, {
            headers: { 'accept': 'application/json' }
          });
          const pollData = await pollResponse.json();

          if (pollData.data?.status === 'Completed' && pollData.data?.result) {
            videoUrl = pollData.data.result;
            break;
          } else if (pollData.data?.status === 'Failed') {
            throw new Error('Video generation failed on server');
          }
        } catch (pollError) {
          console.log(`Poll attempt ${attempts} failed:`, pollError.message);
        }
      }

      if (!videoUrl) {
        throw new Error('Video generation timed out after 3 minutes');
      }

      await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

      await client.sendMessage(m.chat, {
        video: { url: videoUrl },
        caption: `╭───(    TOXIC-MD    )───\n├───≫ Sᴏʀᴀ Vɪᴅᴇᴏ ≪───\n├ \n├ Sora AI Video Generated\n├ Prompt: ${prompt}\n├ Generation time: ${attempts * 3} seconds\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
        gifPlayback: false
      }, { quoted: m });

    } catch (error) {
      console.error('Sora error:', error);
      await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
      await client.sendMessage(m.chat, {
        text: `╭───(    TOXIC-MD    )───\n├───≫ Fᴀɪʟᴇᴅ ≪───\n├ \n├ Video generation failed!\n├ Error: ${error.message}\n├ Try a different prompt.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
      }, { quoted: m });
    }
  }
};
