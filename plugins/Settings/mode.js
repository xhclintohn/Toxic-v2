const { getSettings, updateSetting } = require('../../database/config');
const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

const MODES = {
    public:  { emoji: '🌐', label: 'PUBLIC',  desc: 'Everyone can use commands, anywhere.' },
    private: { emoji: '🔒', label: 'PRIVATE', desc: 'Only you (the owner) can use commands.' },
    group:   { emoji: '👥', label: 'GROUP',   desc: 'Commands work in groups only. DMs ignored.' },
    inbox:   { emoji: '📩', label: 'INBOX',   desc: 'Commands work in DMs only. Groups ignored.' },
};

const CRANKY = {
    public:  "Fine. Everyone gets access. Don't complain when they break everything.",
    private: "Private mode. Nobody touches my commands but you. Finally some peace.",
    group:   "Group mode. DMs are off. If you want something, say it in a group like everyone else.",
    inbox:   "Inbox mode. Groups ignored. Slide into my DMs and we can talk.",
};

module.exports = {
    name: 'mode',
    aliases: ['botmode', 'setmode'],
    description: 'Control who can use the bot and where',
    run: async (context) => {
        await ownerMiddleware(context, async () => {
            const { client, m, args, prefix } = context;

            const fmt = (title, lines) => {
                const body = (Array.isArray(lines) ? lines : [lines]).map(l => `├ ${l}`).join('\n');
                return `╭───(    TOXIC-MD    )───\n├───≫ ${title} ≪───\n├\n${body}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
            };

            try {
                const settings = await getSettings();
                const current = (settings.mode || 'public').toLowerCase();
                const input = (args[0] || '').toLowerCase();

                if (MODES[input]) {
                    if (current === input) {
                        return client.sendMessage(m.chat, {
                            text: fmt('BOT MODE', [
                                `${MODES[input].emoji} Already in ${MODES[input].label} mode.`,
                                `Nothing changed. Still the same.`,
                                `Pick a different one if you actually want to do something.`
                            ])
                        }, { quoted: m });
                    }
                    await updateSetting('mode', input);
                    await client.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } });
                    return client.sendMessage(m.chat, {
                        text: fmt('BOT MODE', [
                            `Switched to ${MODES[input].emoji} ${MODES[input].label}`,
                            ``,
                            CRANKY[input]
                        ])
                    }, { quoted: m });
                }

                const modeInfo = MODES[current] || MODES.public;
                const sections = [{
                    title: 'Choose a mode',
                    rows: Object.entries(MODES).map(([key, val]) => ({
                        title: `${val.emoji} ${val.label}${current === key ? ' (active)' : ''}`,
                        rowId: `${prefix}mode ${key}`,
                        description: val.desc
                    }))
                }];

                await client.sendMessage(m.chat, {
                    text: fmt('BOT MODE', [
                        `Active mode: ${modeInfo.emoji} ${modeInfo.label}`,
                        ``,
                        `🌐 PUBLIC  — Everyone can use commands everywhere`,
                        `🔒 PRIVATE — Only owner can use commands`,
                        `👥 GROUP   — Groups only, DMs are blocked`,
                        `📩 INBOX   — DMs only, groups are ignored`,
                        ``,
                        `Usage: ${prefix}mode public / private / group / inbox`
                    ]),
                    sections,
                    buttonText: 'Switch Mode',
                    footer: '©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧'
                }, { quoted: m });

            } catch {
                client.sendMessage(m.chat, {
                    text: fmt('BOT MODE', 'Something broke. The database is sulking. Try again.')
                }, { quoted: m });
            }
        });
    }
};
