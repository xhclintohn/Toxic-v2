const fetch = require('node-fetch');

module.exports = {
    name: 'imagine',
    aliases: ['aiimage', 'dream', 'generate'],
    description: 'Generates AI images from text prompts',
    run: async (context) => {
        const { client, m, prefix, botname } = context;

        const prompt = m.body.replace(new RegExp(`^${prefix}(imagine|aiimage|dream|generate)\\s*`, 'i'), '').trim();
        
        if (!prompt) {
            return client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Yo, @${m.sender.split('@')[0]}! You forgot the prompt!\n├ Example: ${prefix}imagine a cat playing football\n├ Or: ${prefix}dream a fantasy landscape\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                mentions: [m.sender]
            }, { quoted: m });
        }

        try {
            const loadingMsg = await client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├───≫ Gᴇɴᴇʀᴀᴛɪɴɢ ≪───\n├ \n├ Generating AI image...\n├ Prompt: "${prompt}"\n├ This may take a moment...\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            }, { quoted: m });

            const encodedPrompt = encodeURIComponent(prompt);
            const apiUrl = `https://anabot.my.id/api/ai/dreamImage?prompt=${encodedPrompt}&models=Fantasy&apikey=freeApikey`;
            
            const response = await fetch(apiUrl, { 
                timeout: 60000
            });

            if (!response.ok) {
                throw new Error(`API returned status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success || !data.data?.result) {
                throw new Error('AI failed to generate image');
            }

            const imageUrl = data.data.result;

            await client.sendMessage(m.chat, { 
                delete: loadingMsg.key 
            });

            await client.sendMessage(
                m.chat,
                {
                    image: { url: imageUrl },
                    caption: `╭───(    TOXIC-MD    )───\n├───≫ Aɪ Iᴍᴀɢᴇ ≪───\n├ \n├ AI Image Generated!\n├ Prompt: ${prompt}\n├ Powered by ${botname}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
                },
                { quoted: m }
            );

        } catch (error) {
            console.error('Imagine command error:', error);
            
            try {
                await client.sendMessage(m.chat, { 
                    delete: loadingMsg.key 
                });
            } catch (e) {
            }

            let errorMessage = 'An unexpected error occurred';
            
            if (error.message.includes('status')) {
                errorMessage = 'AI service is not responding properly.';
            } else if (error.message.includes('Network') || error.message.includes('fetch')) {
                errorMessage = 'Network error. Please check your connection.';
            } else if (error.message.includes('timeout')) {
                errorMessage = 'AI generation timed out. Try a simpler prompt.';
            } else if (error.message.includes('AI failed')) {
                errorMessage = 'The AI could not generate an image from your prompt.';
            } else {
                errorMessage = error.message;
            }

            await client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├───≫ Fᴀɪʟᴇᴅ ≪───\n├ \n├ Image Generation Failed!\n├ Error: ${errorMessage}\n├\n├ Tips:\n├ Use descriptive prompts\n├ Avoid complex scenes\n├ Try different keywords\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            }, { quoted: m });
        }
    }
};