const { translate } = require('@vitalets/google-translate-api');

module.exports = {
    name: 'translate',
    aliases: ['tr', 'trans'],
    description: 'Translates text to different languages',
    run: async (context) => {
        const { client, m, prefix } = context;

        const formatStylishReply = (message) => {
            return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈`;
        };

        /**
         * Extract arguments from message
         */
        const args = m.body.replace(new RegExp(`^${prefix}(translate|tr|trans)\\s*`, 'i'), '').trim().split(' ');
        
        const defaultLang = 'id';
        let err = formatStylishReply(`How to use:\n${prefix}tr id hello world\n\nExample:\n${prefix}tr ja Hello how are you?\n${prefix}tr fr Thank you very much`);

        let lang = args[0];
        let text = args.slice(1).join(' ');
        
        // If first argument is not a 2-letter language code, use default language
        if ((args[0] || '').length !== 2) {
            lang = defaultLang;
            text = args.join(' ');
        }
        
        // If no text provided, check if there's a quoted message
        if (!text && m.quoted && m.quoted.text) {
            text = m.quoted.text;
        }

        // Validate inputs
        if (!text) {
            return client.sendMessage(m.chat, {
                text: formatStylishReply(`Yo, @${m.sender.split('@')[0]}! 😤 You forgot the text to translate!\n\n${err}`),
                mentions: [m.sender]
            }, { quoted: m });
        }

        if (!lang || lang.length !== 2) {
            return client.sendMessage(m.chat, {
                text: formatStylishReply(`Invalid language code! 😤\nLanguage code must be 2 letters (e.g., en, id, ja, fr)\n\n${err}`),
                mentions: [m.sender]
            }, { quoted: m });
        }

        try {
            /**
             * Send loading message
             */
            const loadingMsg = await client.sendMessage(m.chat, {
                text: formatStylishReply(`Translating to ${lang.toUpperCase()}... 🔄\nPlease wait...`)
            }, { quoted: m });

            /**
             * Perform translation
             */
            let result = await translate(text, { 
                to: lang, 
                autoCorrect: true 
            }).catch(_ => null);

            if (!result) {
                await client.sendMessage(m.chat, { delete: loadingMsg.key });
                return client.sendMessage(m.chat, {
                    text: formatStylishReply('Translation failed! 😢\nPlease try again with different text.')
                }, { quoted: m });
            }

            // Delete loading message
            await client.sendMessage(m.chat, { delete: loadingMsg.key });

            /**
             * Get language name for better display
             */
            const languageNames = {
                'id': 'Indonesian',
                'en': 'English',
                'ja': 'Japanese',
                'fr': 'French',
                'es': 'Spanish',
                'de': 'German',
                'it': 'Italian',
                'pt': 'Portuguese',
                'ru': 'Russian',
                'zh': 'Chinese',
                'ko': 'Korean',
                'ar': 'Arabic',
                'hi': 'Hindi',
                'tr': 'Turkish',
                'nl': 'Dutch',
                'sv': 'Swedish',
                'pl': 'Polish',
                'th': 'Thai',
                'vi': 'Vietnamese'
            };

            const fromLang = languageNames[result.from.language.iso] || result.from.language.iso.toUpperCase();
            const toLang = languageNames[lang] || lang.toUpperCase();

            /**
             * Send translation result
             */
            await client.sendMessage(m.chat, {
                text: formatStylishReply(`Translation Result 🌐\n\nFrom: ${fromLang}\nTo: ${toLang}\n\nOriginal Text:\n${text}\n\nTranslated Text:\n${result.text}`)
            }, { quoted: m });

            // If there's autocorrect, show it
            if (result.raw && result.raw.sentences && result.raw.sentences[0] && result.raw.sentences[0].trans) {
                const transLiteration = result.raw.sentences[0].trans;
                if (transLiteration && transLiteration !== result.text) {
                    await client.sendMessage(m.chat, {
                        text: formatStylishReply(`Transliteration:\n${transLiteration}`)
                    }, { quoted: m });
                }
            }

        } catch (e) {
            console.error('Translation error:', e);
            
            let errorMessage = 'Translation failed!';
            
            if (e.message.includes('Invalid target language')) {
                errorMessage = 'Invalid language code! Use 2-letter codes like: en, id, ja, fr, es, etc.';
            } else if (e.message.includes('Network Error')) {
                errorMessage = 'Network error! Please check your connection.';
            } else if (e.message.includes('Too many requests')) {
                errorMessage = 'Too many requests! Please wait a moment and try again.';
            }

            await client.sendMessage(m.chat, {
                text: formatStylishReply(`${errorMessage}\n\nExample usage:\n${prefix}tr id Hello world\n${prefix}tr ja How are you?`)
            }, { quoted: m });
        }
    }
};