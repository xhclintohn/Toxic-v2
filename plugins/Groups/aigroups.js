import { getFakeQuoted } from '../../lib/fakeQuoted.js';

const HEADER = `╭───(    TOXIC-MD    )───\n├───≫ AI GROUPS ≪───\n├`;
const FOOTER = `╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

function box(lines) {
    return `${HEADER}\n${lines.map(l => `├ ${l}`).join('\n')}\n├\n${FOOTER}`;
}

const isOwner = (m, context) => {
    const { isOwner: own, isSudo } = context;
    return own || isSudo;
};

export default [
    {
        name: 'ngc',
        aliases: ['newgc', 'groupcreate', 'aigcreate', 'creategroup', 'createaig'],
        description: 'Create a new AI WhatsApp group',
        run: async (context) => {
            const { client, m, args, text } = context;
            const fq = getFakeQuoted(m);
            if (!isOwner(m, context)) {
                return client.sendMessage(m.chat, { text: box(['❌ *Owner only command.*']) }, { quoted: fq });
            }
            const groupName = text?.trim();
            if (!groupName) {
                return client.sendMessage(m.chat, {
                    text: box([
                        '📋 *Usage:* .ngc <group name>',
                        '',
                        '📌 *Examples:*',
                        '  .ngc My AI Group',
                        '  .newgc Toxic Squad',
                        '  .groupcreate Test Group',
                    ])
                }, { quoted: fq });
            }
            await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });
            try {
                const botJid = client.user?.id || '';
                const group = await client.aiGroupCreate(groupName, [botJid]);
                const jid = group?.id || group?.gid || group;
                await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });
                await client.sendMessage(m.chat, {
                    text: box([
                        `✅ *AI Group Created!*`,
                        ``,
                        `📛 *Name:* ${groupName}`,
                        `🔗 *JID:* ${jid}`,
                    ])
                }, { quoted: fq });
            } catch (e) {
                await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
                await client.sendMessage(m.chat, {
                    text: box([`❌ *Failed:* ${e.message}`])
                }, { quoted: fq });
            }
        }
    },

    {
        name: 'aigbot',
        aliases: ['addaibot', 'aigaddbot', 'aibot'],
        description: 'Add the WhatsApp AI bot to this group',
        run: async (context) => {
            const { client, m } = context;
            const fq = getFakeQuoted(m);
            if (!isOwner(m, context)) {
                return client.sendMessage(m.chat, { text: box(['❌ *Owner only command.*']) }, { quoted: fq });
            }
            if (!m.isGroup) {
                return client.sendMessage(m.chat, { text: box(['❌ *Use this in a group.*']) }, { quoted: fq });
            }
            await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });
            try {
                await client.aiGroupAddBot(m.chat);
                await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });
                await client.sendMessage(m.chat, {
                    text: box(['✅ *WhatsApp AI bot added to this group!*'])
                }, { quoted: fq });
            } catch (e) {
                await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
                await client.sendMessage(m.chat, {
                    text: box([`❌ *Failed:* ${e.message}`])
                }, { quoted: fq });
            }
        }
    },

    {
        name: 'aiginfo',
        aliases: ['aigroupinfo', 'aiggroupinfo', 'aigmeta'],
        description: 'Get AI group metadata/info',
        run: async (context) => {
            const { client, m } = context;
            const fq = getFakeQuoted(m);
            if (!isOwner(m, context)) {
                return client.sendMessage(m.chat, { text: box(['❌ *Owner only command.*']) }, { quoted: fq });
            }
            if (!m.isGroup) {
                return client.sendMessage(m.chat, { text: box(['❌ *Use this in a group.*']) }, { quoted: fq });
            }
            await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });
            try {
                const meta = await client.aiGroupMetadata(m.chat);
                const name = meta?.subject || meta?.name || 'Unknown';
                const desc = meta?.desc || meta?.description || 'None';
                const participants = meta?.participants?.length ?? '?';
                await client.sendMessage(m.chat, { react: { text: '📋', key: m.reactKey } });
                await client.sendMessage(m.chat, {
                    text: box([
                        `📛 *Name:* ${name}`,
                        `👥 *Members:* ${participants}`,
                        `📝 *Desc:* ${desc}`,
                    ])
                }, { quoted: fq });
            } catch (e) {
                await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
                await client.sendMessage(m.chat, {
                    text: box([`❌ *Failed:* ${e.message}`])
                }, { quoted: fq });
            }
        }
    },

    {
        name: 'aiglink',
        aliases: ['aiginvite', 'aigrouplink', 'aiginvitelink'],
        description: 'Get the AI group invite link',
        run: async (context) => {
            const { client, m } = context;
            const fq = getFakeQuoted(m);
            if (!isOwner(m, context)) {
                return client.sendMessage(m.chat, { text: box(['❌ *Owner only command.*']) }, { quoted: fq });
            }
            if (!m.isGroup) {
                return client.sendMessage(m.chat, { text: box(['❌ *Use this in a group.*']) }, { quoted: fq });
            }
            await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });
            try {
                const code = await client.aiGroupInviteCode(m.chat);
                const link = `https://chat.whatsapp.com/${code}`;
                await client.sendMessage(m.chat, { react: { text: '🔗', key: m.reactKey } });
                await client.sendMessage(m.chat, {
                    text: box([`🔗 *AI Group Invite Link:*`, ``, link])
                }, { quoted: fq });
            } catch (e) {
                await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
                await client.sendMessage(m.chat, {
                    text: box([`❌ *Failed:* ${e.message}`])
                }, { quoted: fq });
            }
        }
    },

    {
        name: 'aigrevoke',
        aliases: ['aigresetlink', 'aignewlink', 'aigreset'],
        description: 'Revoke and reset the AI group invite link',
        run: async (context) => {
            const { client, m } = context;
            const fq = getFakeQuoted(m);
            if (!isOwner(m, context)) {
                return client.sendMessage(m.chat, { text: box(['❌ *Owner only command.*']) }, { quoted: fq });
            }
            if (!m.isGroup) {
                return client.sendMessage(m.chat, { text: box(['❌ *Use this in a group.*']) }, { quoted: fq });
            }
            await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });
            try {
                const code = await client.aiGroupRevokeInvite(m.chat);
                const link = code ? `https://chat.whatsapp.com/${code}` : 'Done';
                await client.sendMessage(m.chat, { react: { text: '🔄', key: m.reactKey } });
                await client.sendMessage(m.chat, {
                    text: box([`🔄 *Invite link reset!*`, ``, `🔗 *New link:* ${link}`])
                }, { quoted: fq });
            } catch (e) {
                await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
                await client.sendMessage(m.chat, {
                    text: box([`❌ *Failed:* ${e.message}`])
                }, { quoted: fq });
            }
        }
    },

    {
        name: 'aigleave',
        aliases: ['aigroupleave', 'leaveaig', 'aigbye'],
        description: 'Leave the AI group',
        run: async (context) => {
            const { client, m } = context;
            const fq = getFakeQuoted(m);
            if (!isOwner(m, context)) {
                return client.sendMessage(m.chat, { text: box(['❌ *Owner only command.*']) }, { quoted: fq });
            }
            if (!m.isGroup) {
                return client.sendMessage(m.chat, { text: box(['❌ *Use this in a group.*']) }, { quoted: fq });
            }
            await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });
            try {
                await client.aiGroupLeave(m.chat);
                await client.sendMessage(m.chat, { react: { text: '👋', key: m.reactKey } });
                await client.sendMessage(m.chat, {
                    text: box(['👋 *Left the AI group.*'])
                }, { quoted: fq });
            } catch (e) {
                await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
                await client.sendMessage(m.chat, {
                    text: box([`❌ *Failed:* ${e.message}`])
                }, { quoted: fq });
            }
        }
    },

    {
        name: 'aigephem',
        aliases: ['aigdisappear', 'aigephemeralmsg', 'aigvanish'],
        description: 'Set disappearing messages in AI group (0=off, 1=24h, 2=7d, 3=90d)',
        run: async (context) => {
            const { client, m, args } = context;
            const fq = getFakeQuoted(m);
            if (!isOwner(m, context)) {
                return client.sendMessage(m.chat, { text: box(['❌ *Owner only command.*']) }, { quoted: fq });
            }
            if (!m.isGroup) {
                return client.sendMessage(m.chat, { text: box(['❌ *Use this in a group.*']) }, { quoted: fq });
            }
            const durations = { '0': 0, '1': 86400, '2': 604800, '3': 7776000 };
            const arg = args?.[0] || '0';
            const secs = durations[arg] ?? 0;
            const labels = { 0: 'Off', 86400: '24 hours', 604800: '7 days', 7776000: '90 days' };
            await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });
            try {
                await client.aiGroupToggleEphemeral(m.chat, secs);
                await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });
                await client.sendMessage(m.chat, {
                    text: box([
                        `⏳ *Disappearing messages:* ${labels[secs] || 'Off'}`,
                        ``,
                        `📋 Options: 0=Off, 1=24h, 2=7d, 3=90d`,
                    ])
                }, { quoted: fq });
            } catch (e) {
                await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
                await client.sendMessage(m.chat, {
                    text: box([`❌ *Failed:* ${e.message}`])
                }, { quoted: fq });
            }
        }
    },
];
