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
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, @${m.sender.split('@')[0]}! 😤 You forgot the prompt!\n│❒ Example: ${prefix}sora a cat dancing in space\n┗━━━━━━━━━━━━━━━┛`,
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
        headers: {
          'accept': 'application/json'
        }
      });

      const data = await response.json();
      console.log('API Response:', JSON.stringify(data, null, 2));

      if (!data || !data.status || !data.result) {
        throw new Error(data?.message || 'API returned no video');
      }

      const videoUrl = data.result;
      
      if (!videoUrl || !videoUrl.startsWith('http')) {
        throw new Error('Invalid video URL received');
      }

      await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

      await client.sendMessage(m.chat, {
        video: { url: videoUrl },
        caption: `🎬 *Sora AI Video Generated*\n\n📝 *Prompt:* ${prompt}\n\n⚡ _Powered by Toxic-MD_`,
        gifPlayback: false
      }, { quoted: m });

    } catch (error) {
      console.error('Sora error:', error);
      await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
      await client.sendMessage(m.chat, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Video generation failed!\n│❒ Error: ${error.message}\n│❒ Try a different prompt.\n┗━━━━━━━━━━━━━━━┛`
      }, { quoted: m });
    }
  }
};