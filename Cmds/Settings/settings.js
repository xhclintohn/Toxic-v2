const { getSettings, getSudoUsers, getBannedUsers } = require('../../Database/config');

module.exports = async (context) => {
  const { client, m } = context;

  const settings = await getSettings();
  if (!settings) {
    return await m.reply(
      `◈━━━━━━━━━━━━━━━━◈\n` +
      `│❒ Yo, no settings found in the database! 😈\n` +
      `│❒ Fix it and try again, champ! 🥶\n` +
      `┗━━━━━━━━━━━━━━━┛`
    );
  }

  const prefix = settings.prefix || '.';
  const botName = process.env.BOTNAME || settings.botname || 'Toxic-MD';
  const sudoUsers = await getSudoUsers();
  const bannedUsers = await getBannedUsers();
  const groups = await client.groupFetchAllParticipating();
  const groupCount = Object.keys(groups).length;

  const response = 
    `◈━━━━━━━━━━━━━━━━◈\n` +
    `│❒ *Toxic-MD Settings* 🔥\n` +
    `┗━━━━━━━━━━━━━━━┛\n\n` +

    `◈━━━━━━━━━━━━━━━━◈\n` +
    `│❒ *Botname*: ${botName}\n` +
    `│❒ Call me the boss! 😎\n` +
    `│❒ Ex: ${prefix}bot\n` +
    `┗━━━━━━━━━━━━━━━┛\n` +

    `◈━━━━━━━━━━━━━━━━◈\n` +
    `│❒ *Prefix*: ${settings.prefix || 'No prefix set! 🥶'}\n` +
    `│❒ Set your command trigger!\n` +
    `│❒ Ex: ${prefix}prefix !\n` +
    `┗━━━━━━━━━━━━━━━┛\n` +

    `◈━━━━━━━━━━━━━━━━◈\n` +
    `│❒ *Autoread*: ${settings.autoread ? '✅ ON, I see everything' : '❌ OFF, ignoring DMs'}\n` +
    `│❒ Auto-read messages or skip ’em!\n` +
    `│❒ Ex: ${prefix}autoread on\n` +
    `┗━━━━━━━━━━━━━━━┛\n` +

    `◈━━━━━━━━━━━━━━━━◈\n` +
    `│❒ *Autoview Status*: ${settings.autoview ? '✅ ON, checking stories' : '❌ OFF, not watching'}\n` +
    `│❒ View statuses automatically!\n` +
    `│❒ Ex: ${prefix}autoview on\n` +
    `┗━━━━━━━━━━━━━━━┛\n` +

    `◈━━━━━━━━━━━━━━━━◈\n` +
    `│❒ *Autolike Status*: ${settings.autolike ? '✅ ON, liking stories 😘' : '❌ OFF, no likes'}\n` +
    `│❒ Auto-like statuses or stay cold!\n` +
    `│❒ Ex: ${prefix}autolike on\n` +
    `┗━━━━━━━━━━━━━━━┛\n` +

    `◈━━━━━━━━━━━━━━━━◈\n` +
    `│❒ *React Emoji*: ${settings.reactEmoji || 'None set! 😴'}\n` +
    `│❒ My vibe on statuses!\n` +
    `│❒ Ex: ${prefix}reaction 😈\n` +
    `┗━━━━━━━━━━━━━━━┛\n` +

    `◈━━━━━━━━━━━━━━━━◈\n` +
    `│❒ *Sticker Watermark*: ${settings.packname || 'None set! 🥶'}\n` +
    `│❒ Brand your stickers!\n` +
    `│❒ Ex: ${prefix}setpackname Toxic-MD\n` +
    `┗━━━━━━━━━━━━━━━┛\n` +

    `◈━━━━━━━━━━━━━━━━◈\n` +
    `│❒ *Autobio*: ${settings.autobio ? '✅ ON, flexing 24/7' : '❌ OFF, staying lowkey'}\n` +
    `│❒ Auto-update my status!\n` +
    `│❒ Ex: ${prefix}autobio on\n` +
    `┗━━━━━━━━━━━━━━━┛\n` +

    `◈━━━━━━━━━━━━━━━━◈\n` +
    `│❒ *Anticall*: ${settings.anticall ? '✅ ON, blocking calls' : '❌ OFF, calls allowed'}\n` +
    `│❒ Stop annoying callers!\n` +
    `│❒ Ex: ${prefix}anticall on\n` +
    `┗━━━━━━━━━━━━━━━┛\n` +

    `◈━━━━━━━━━━━━━━━━◈\n` +
    `│❒ *Presence*: ${settings.presence || 'Offline by default! 😴'}\n` +
    `│❒ My online vibe!\n` +
    `│❒ Ex: ${prefix}setpresence typing\n` +
    `┗━━━━━━━━━━━━━━━┛\n` +

    `◈━━━━━━━━━━━━━━━━◈\n` +
    `│❒ *Mode*: ${settings.mode || 'Public by default! 🥶'}\n` +
    `│❒ Public or private access!\n` +
    `│❒ Ex: ${prefix}mode private\n` +
    `┗━━━━━━━━━━━━━━━┛\n\n` +

    `◈━━━━━━━━━━━━━━━━◈\n` +
    `│❒ *Stats* 📊\n` +
    `│❒ *Sudo Users*: ${sudoUsers.length > 0 ? sudoUsers.join(', ') : 'Just me, the king! 😈'}\n` +
    `│❒ *Banned Users*: ${bannedUsers.length} (stay mad!)\n` +
    `│❒ *Total Groups*: ${groupCount} (ruling them all!)\n` +
    `┗━━━━━━━━━━━━━━━┛`;

  console.log('[SETTINGS] Sending response:', response.slice(0, 100) + '...');
  await m.reply(response);
};