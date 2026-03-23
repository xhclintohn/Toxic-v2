const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

const BLOCKED_PATTERNS = [
    /heroku_api_key/i,
    /HEROKU_API_KEY/,
    /getHerokuApiKey/,
    /herokuApiKey/,
    /process\.env/,
    /config\/settings/,
    /require\s*\(\s*['"].*settings['"]/
];

function sanitizeOutput(text) {
    const apiKey = process.env.HEROKU_API_KEY || '';
    const session = process.env.SESSION || '';
    const dbUrl = process.env.DATABASE_URL || '';
    let out = text;
    if (apiKey) out = out.split(apiKey).join('[REDACTED]');
    if (session) out = out.split(session).join('[REDACTED]');
    if (dbUrl) out = out.split(dbUrl).join('[REDACTED]');
    return out;
}

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, text, isAdmin, isBotAdmin, IsGroup: isGroup, participants, args, store, Owner, pict } = context;

        try {
            const trimmedText = text.trim();

            if (!trimmedText) {
                return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ No command provided for eval!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
            }

            for (const pattern of BLOCKED_PATTERNS) {
                if (pattern.test(trimmedText)) {
                    return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ BLOCKED ≪───\n├ \n├ That eval is blocked for security.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
                }
            }

            let evaled = await eval(trimmedText);
            if (typeof evaled !== 'string') evaled = require('util').inspect(evaled);
            evaled = sanitizeOutput(evaled);
            await m.reply(evaled);

        } catch (err) {
            await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ EVAL ERROR ≪───\n├ \n├ ${sanitizeOutput(String(err))}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
    });
};
