const { getSettings, updateSetting } = require('../../database/config');
const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

const LANG_SECTIONS = [
    {
        title: '🌍 Most Popular',
        langs: [
            { code: 'es', name: 'Spanish',    native: 'Español' },
            { code: 'fr', name: 'French',     native: 'Français' },
            { code: 'de', name: 'German',     native: 'Deutsch' },
            { code: 'pt', name: 'Portuguese', native: 'Português' },
            { code: 'ar', name: 'Arabic',     native: 'العربية' },
            { code: 'zh', name: 'Chinese',    native: '中文' },
            { code: 'hi', name: 'Hindi',      native: 'हिंदी' },
            { code: 'ru', name: 'Russian',    native: 'Русский' },
            { code: 'ja', name: 'Japanese',   native: '日本語' },
            { code: 'ko', name: 'Korean',     native: '한국어' },
        ]
    },
    {
        title: '🌍 African Languages',
        langs: [
            { code: 'sw', name: 'Swahili',  native: 'Kiswahili' },
            { code: 'am', name: 'Amharic',  native: 'አማርኛ' },
            { code: 'yo', name: 'Yoruba',   native: 'Yorùbá' },
            { code: 'ig', name: 'Igbo',     native: 'Igbo' },
            { code: 'ha', name: 'Hausa',    native: 'Hausa' },
            { code: 'zu', name: 'Zulu',     native: 'isiZulu' },
            { code: 'so', name: 'Somali',   native: 'Soomaali' },
            { code: 'ny', name: 'Chichewa', native: 'Chichewa' },
            { code: 'sn', name: 'Shona',    native: 'chiShona' },
            { code: 'st', name: 'Sesotho',  native: 'Sesotho' },
        ]
    },
    {
        title: '🌍 European',
        langs: [
            { code: 'it', name: 'Italian',    native: 'Italiano' },
            { code: 'nl', name: 'Dutch',      native: 'Nederlands' },
            { code: 'pl', name: 'Polish',     native: 'Polski' },
            { code: 'sv', name: 'Swedish',    native: 'Svenska' },
            { code: 'no', name: 'Norwegian',  native: 'Norsk' },
            { code: 'da', name: 'Danish',     native: 'Dansk' },
            { code: 'fi', name: 'Finnish',    native: 'Suomi' },
            { code: 'tr', name: 'Turkish',    native: 'Türkçe' },
            { code: 'uk', name: 'Ukrainian',  native: 'Українська' },
            { code: 'ro', name: 'Romanian',   native: 'Română' },
            { code: 'el', name: 'Greek',      native: 'Ελληνικά' },
            { code: 'hu', name: 'Hungarian',  native: 'Magyar' },
            { code: 'cs', name: 'Czech',      native: 'Čeština' },
        ]
    },
    {
        title: '🌏 Asian & Pacific',
        langs: [
            { code: 'th', name: 'Thai',        native: 'ภาษาไทย' },
            { code: 'vi', name: 'Vietnamese',  native: 'Tiếng Việt' },
            { code: 'id', name: 'Indonesian',  native: 'Bahasa Indonesia' },
            { code: 'ms', name: 'Malay',       native: 'Bahasa Melayu' },
            { code: 'fil', name: 'Filipino',   native: 'Filipino' },
            { code: 'bn', name: 'Bengali',     native: 'বাংলা' },
            { code: 'ur', name: 'Urdu',        native: 'اردو' },
            { code: 'fa', name: 'Persian',     native: 'فارسی' },
            { code: 'ne', name: 'Nepali',      native: 'नेपाली' },
            { code: 'si', name: 'Sinhala',     native: 'සිංහල' },
            { code: 'my', name: 'Burmese',     native: 'မြန်မာ' },
        ]
    }
];

module.exports = {
    name: 'botlang',
    aliases: ['language', 'botlanguage', 'lang', 'l'],
    description: 'Set the language the bot replies in',
    run: async (context) => {
        await ownerMiddleware(context, async () => {
            const { client, m, args, prefix } = context;

            const fmt = (title, lines) => {
                const body = (Array.isArray(lines) ? lines : [lines]).map(l => `├ ${l}`).join('\n');
                return `╭───(    TOXIC-MD    )───\n├───≫ ${title} ≪───\n├\n${body}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
            };

            try {
                const settings = await getSettings();
                const currentLang = settings.botlang || 'en';
                const input = (args[0] || '').toLowerCase().trim();

                if (input === 'off' || input === 'en' || input === 'english' || input === 'reset') {
                    if (currentLang === 'en') {
                        return client.sendMessage(m.chat, {
                            text: fmt('BOT LANGUAGE', [
                                "Already set to English. That's the default.",
                                "I talk how I talk. Nothing to change here."
                            ])
                        }, { quoted: m });
                    }
                    await updateSetting('botlang', 'en');
                    await client.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } });
                    return client.sendMessage(m.chat, {
                        text: fmt('BOT LANGUAGE', [
                            'Language reset to English.',
                            "Back to basics. How refreshing."
                        ])
                    }, { quoted: m });
                }

                if (input) {
                    const allLangs = LANG_SECTIONS.flatMap(s => s.langs);
                    const found = allLangs.find(l =>
                        l.code === input ||
                        l.name.toLowerCase() === input ||
                        l.native.toLowerCase() === input
                    );
                    const code = found?.code || (input.length <= 5 ? input : null);
                    if (!code) {
                        return client.sendMessage(m.chat, {
                            text: fmt('BOT LANGUAGE', [
                                `"${input}" — no idea what that is.`,
                                "Use a language code like: es, de, fr, sw, zh",
                                `Or just run ${prefix}botlang to see all options.`
                            ])
                        }, { quoted: m });
                    }
                    await updateSetting('botlang', code);
                    await client.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } });
                    const name = found ? `${found.name} (${found.native})` : code.toUpperCase();
                    return client.sendMessage(m.chat, {
                        text: fmt('BOT LANGUAGE', [
                            `Language set to: ${name}`,
                            `All my replies will be translated from now on.`,
                            `If something looks wrong, blame Google. Not me.`,
                            ``,
                            `To go back: ${prefix}botlang off`
                        ])
                    }, { quoted: m });
                }

                const currentInfo = LANG_SECTIONS.flatMap(s => s.langs).find(l => l.code === currentLang);
                const currentDisplay = currentLang === 'en'
                    ? '🇬🇧 English (default)'
                    : currentInfo
                        ? `${currentInfo.name} (${currentInfo.native}) [${currentLang}]`
                        : currentLang;

                const sections = LANG_SECTIONS.map(section => ({
                    title: section.title,
                    rows: section.langs.map(l => ({
                        title: `${l.name}${currentLang === l.code ? ' ✓' : ''}`,
                        rowId: `${prefix}botlang ${l.code}`,
                        description: `${l.native} · code: ${l.code}`
                    }))
                }));

                sections.push({
                    title: '🔄 Reset',
                    rows: [{
                        title: 'English (default)',
                        rowId: `${prefix}botlang en`,
                        description: 'Turn off translation, reply in English'
                    }]
                });

                await client.sendMessage(m.chat, {
                    text: fmt('BOT LANGUAGE', [
                        `Current: ${currentDisplay}`,
                        ``,
                        `Pick a language below and all bot replies`,
                        `will be automatically translated.`,
                        ``,
                        `Or type: ${prefix}botlang <code>   e.g. ${prefix}botlang de`,
                        `Reset:   ${prefix}botlang off`
                    ]),
                    sections,
                    buttonText: 'Choose Language',
                    footer: '©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧'
                }, { quoted: m });

            } catch {
                client.sendMessage(m.chat, {
                    text: fmt('BOT LANGUAGE', 'Something went wrong. Database throwing a tantrum again.')
                }, { quoted: m });
            }
        });
    }
};
