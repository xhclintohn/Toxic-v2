module.exports = {
    name: 'translate',
    aliases: ['tr', 'trans'],
    description: 'Translates text to different languages',
    run: async (context) => {
        const { client, m, prefix } = context;

        const formatStylishReply = (message) => {
            return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈`;
        };

        console.log('Translate command triggered!'); // Debug log

        try {
            // Test if we can require the package
            console.log('Attempting to require translate package...');
            const { translate } = require('@vitalets/google-translate-api');
            console.log('Package required successfully!');

            const fullText = m.body.replace(new RegExp(`^${prefix}(translate|tr|trans)\\s*`, 'i'), '').trim();
            console.log('Full text:', fullText);

            if (!fullText && !m.quoted?.text) {
                console.log('No text provided, sending help');
                return client.sendMessage(m.chat, {
                    text: formatStylishReply(`How to use:\n• ${prefix}tr id hello world\n• ${prefix}tr ja Hello how are you?\n• Reply to a message with: ${prefix}tr en`)
                }, { quoted: m });
            }

            let lang, text;

            if (m.quoted?.text) {
                lang = fullText || 'en';
                text = m.quoted.text;
                console.log('Using quoted text, lang:', lang);
            } else {
                const parts = fullText.split(' ');
                if (parts.length >= 2 && parts[0].length === 2) {
                    lang = parts[0];
                    text = parts.slice(1).join(' ');
                } else {
                    lang = 'en';
                    text = fullText;
                }
                console.log('Using command text, lang:', lang, 'text:', text);
            }

            // Send loading message
            await client.sendMessage(m.chat, {
                text: formatStylishReply(`Translating to ${lang.toUpperCase()}... 🔄`)
            }, { quoted: m });

            console.log('Calling translate API...');
            const result = await translate(text, { to: lang });
            console.log('Translation successful!');

            // Language names
            const languageNames = {
                'id': 'Indonesian', 'en': 'English', 'ja': 'Japanese', 'fr': 'French',
                'es': 'Spanish', 'de': 'German', 'it': 'Italian', 'pt': 'Portuguese',
                'ru': 'Russian', 'zh': 'Chinese', 'ko': 'Korean', 'ar': 'Arabic',
                'hi': 'Hindi', 'tr': 'Turkish'
            };

            const fromLang = languageNames[result.from.language.iso] || result.from.language.iso.toUpperCase();
            const toLang = languageNames[lang] || lang.toUpperCase();

            await client.sendMessage(m.chat, {
                text: formatStylishReply(`🌐 Translation\n\n📥 ${fromLang}: ${text}\n📤 ${toLang}: ${result.text}`)
            }, { quoted: m });

        } catch (error) {
            console.error('TRANSLATE ERROR:', error);
            
            // Send detailed error to chat for debugging
            await client.sendMessage(m.chat, {
                text: formatStylishReply(`❌ Error Details:\n${error.message}\n\nStack: ${error.stack}`)
            }, { quoted: m });
        }
    }
};