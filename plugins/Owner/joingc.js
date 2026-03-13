const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, text, args, Owner, botname } = context;

        if (!botname) {
            console.error(`Join-Error: botname missing in context.`);
            return m.reply(
                `╭───(    TOXIC-MD    )───\n├ \n├ Bot's fucked. No botname in context.\n├ Yell at your dev, dumbass.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            );
        }

        if (!Owner) {
            console.error(`Join-Error: Owner missing in context.`);
            return m.reply(
                `╭───(    TOXIC-MD    )───\n├ \n├ Bot's broken. No owner in context.\n├ Go cry to the dev.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            );
        }

        let raw = (text && text.trim()) || (m.quoted && ((m.quoted.text) || (m.quoted && m.quoted.caption))) || "";
        raw = String(raw || "").trim();

        if (!raw) {
            return m.reply(
                `╭───(    TOXIC-MD    )───\n├───≫ USAGE ≪───\n├ \n├ Provide a real group invite link\n├ or reply to one.\n├ Example: *${args && args[0] ? args[0] : '.join https://chat.whatsapp.com/abcdef...'}*\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            );
        }

        const urlRegex = /(?:https?:\/\/)?chat\.whatsapp\.com\/([A-Za-z0-9_-]+)/i;
        const match = raw.match(urlRegex);
        let inviteCode = match ? match[1] : null;

        if (!inviteCode) {
            const token = raw.split(/\s+/)[0];
            if (/^[A-Za-z0-9_-]{8,}$/.test(token)) {
                inviteCode = token;
            }
        }

        if (!inviteCode) {
            return m.reply(
                `╭───(    TOXIC-MD    )───\n├ \n├ That ain't a valid link or invite\n├ code. Don't waste my time.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            );
        }

        inviteCode = inviteCode.replace(/\?.*$/, '').trim();

        try {
            const info = await client.groupGetInviteInfo(inviteCode);
            const subject = info?.subject || info?.groupMetadata?.subject || "Unknown Group";

            await client.groupAcceptInvite(inviteCode);

            return m.reply(
                `╭───(    TOXIC-MD    )───\n├───≫ JOINED ≪───\n├ \n├ Joined: *${subject}*\n├ Don't spam, or I'll ghost you.\n├ — ${botname}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            );
        } catch (error) {
            console.error(`[JOIN-ERROR] invite=${inviteCode}`, error && (error.stack || error));

            const status =
                (error && error.output && error.output.statusCode) ||
                error?.statusCode ||
                error?.status ||
                (error?.data && (error.data.status || error.data)) ||
                (error?.response && error.response.status) ||
                null;

            if (status === 400 || status === 404) {
                return m.reply(
                    `╭───(    TOXIC-MD    )───\n├ \n├ Group does not exist or the link\n├ is invalid. Stop sending trash links.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
                );
            }
            if (status === 401) {
                return m.reply(
                    `╭───(    TOXIC-MD    )───\n├ \n├ I was previously removed from that\n├ group. I can't rejoin using this link.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
                );
            }
            if (status === 409) {
                return m.reply(
                    `╭───(    TOXIC-MD    )───\n├ \n├ I'm already in that group, genius.\n├ You trying to confuse me?\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
                );
            }
            if (status === 410) {
                return m.reply(
                    `╭───(    TOXIC-MD    )───\n├ \n├ That invite link was reset. Get a\n├ fresh one and try again.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
                );
            }
            if (status === 403) {
                return m.reply(
                    `╭───(    TOXIC-MD    )───\n├ \n├ I don't have permission to join\n├ that group. Maybe it's private.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
                );
            }
            if (status === 500) {
                return m.reply(
                    `╭───(    TOXIC-MD    )───\n├ \n├ That group is full or server error.\n├ Try later or check the link.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
                );
            }

            const shortMsg = (error && (error.message || (typeof error === 'string' ? error : 'Unknown error'))) || 'Unknown error';
            return m.reply(
                `╭───(    TOXIC-MD    )───\n├───≫ FAILED ≪───\n├ \n├ Failed to join: ${shortMsg}\n├ Check the link or try again.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            );
        }
    });
};
