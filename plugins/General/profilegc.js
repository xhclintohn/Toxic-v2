module.exports = async (context) => {
    const { client, m } = context;

    function convertTimestamp(timestamp) {
        const d = new Date(timestamp * 1000);
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return {
            date: d.getDate(),
            month: new Intl.DateTimeFormat('en-US', { month: 'long' }).format(d),
            year: d.getFullYear(),
            day: daysOfWeek[d.getUTCDay()],
            time: `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}:${d.getUTCSeconds().toString().padStart(2, '0')}`
        }
    }

    if (!m.isGroup) return m.reply("This command is meant for groups");

    let info = await client.groupMetadata(m.chat);
    let ts = await convertTimestamp(info.creation);

    try {
        var pp = await client.profilePictureUrl(m.chat, 'image');
    } catch {
        var pp = 'https://telegra.ph/file/9521e9ee2fdbd0d6f4f1c.jpg';
    }

    const membersCount = info.participants.filter(p => !p.admin).length;
    const adminsCount = info.participants.filter(p => p.admin).length;
    const owner = info.owner || info.participants.find(p => p.admin === 'superadmin')?.id;

    const caption = `╭───〔 🏷️ GROUP INFO 〕───╮\n` +
                   `│\n` +
                   `│  📛 Name : *${info.subject}*\n` +
                   `│  🆔 ID : *${info.id}*\n` +
                   `│  👑 Owner : ${owner ? '@' + owner.split('@')[0] : 'Unknown'}\n` +
                   `│\n` +
                   `│  📅 Created :\n` +
                   `│   └ ${ts.day}, ${ts.date} ${ts.month} ${ts.year}\n` +
                   `│   └ ${ts.time} UTC\n` +
                   `│\n` +
                   `│  👥 Participants :\n` +
                   `│   ├ Total : *${info.size}*\n` +
                   `│   ├ Members : *${membersCount}*\n` +
                   `│   └ Admins : *${adminsCount}*\n` +
                   `│\n` +
                   `│  ⚙️ Settings :\n` +
                   `│   ├ Messages : ${info.announce ? 'Admins Only' : 'Everyone'}\n` +
                   `│   ├ Edit Info : ${info.restrict ? 'Admins Only' : 'Everyone'}\n` +
                   `│   └ Add Members : ${info.memberAddMode ? 'Everyone' : 'Admins Only'}\n` +
                   `│\n` +
                   `╰────〔 Tσxιƈ-ɱԃȥ 〕────╯`;

    await client.sendMessage(m.chat, { 
        image: { url: pp }, 
        caption: caption
    }, { quoted: m });
};