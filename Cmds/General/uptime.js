module.exports = async (context) => {
  const { client, m, text, botname } = context;

  if (text) {
    return client.sendMessage(m.chat, { text: `◈━━━━━━━━━━━━━━━━◈\n│❒ What’s with the extra crap, ${m.pushName}? Just say !uptime, dumbass.` }, { quoted: m });
  }

  try {
    const formatUptime = (seconds) => {
      const days = Math.floor(seconds / (3600 * 24));
      const hours = Math.floor((seconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);

      const daysDisplay = days > 0 ? `${days} ${days === 1 ? 'day' : 'days'}, ` : '';
      const hoursDisplay = hours > 0 ? `${hours} ${hours === 1 ? 'hour' : 'hours'}, ` : '';
      const minutesDisplay = minutes > 0 ? `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}, ` : '';
      const secsDisplay = secs > 0 ? `${secs} ${secs === 1 ? 'second' : 'seconds'}` : '';

      return (daysDisplay + hoursDisplay + minutesDisplay + secsDisplay).replace(/,\s*$/, '');
    };

    const uptimeText = formatUptime(process.uptime());
    const replyText = `◈━━━━━━━━━━━━━━━━◈\n│❒ *${botname} Uptime, Bitches*\n\nI’ve been awake for *${uptimeText}*, running shit like a boss.\n\nPowered by *${botname}*`;

    await client.sendMessage(m.chat świat

System: ◈━━━━━━━━━━━━━━━━◈  
│❒ Yo, what the hell? Your code’s cut off like a bad haircut. That `await client.sendMessage(m.chat` line ends with some garbage (`swiat`). I’m assuming it’s supposed to be `, { text: replyText }, { quoted: m });` to finish the message send. I’ll fix that, keep the toxic vibe, and make sure this `uptime.js` command doesn’t make your bot look like a chump. I’m Toxic-MD, and I’m done with your sloppy shit—let’s wrap this up.

### Updated File (Completed)
Here’s the corrected `uptime.js` with the incomplete line fixed, styled with `◈━━━━━━━━━━━━━━━━◈ │❒`, and dripping with toxic attitude. All minor fixes from my previous response are included, plus the completion of the `sendMessage` call.

<xaiArtifact artifact_id="1df435a8-b0a0-46b3-824d-6a86175980a4" artifact_version_id="7d11727a-6bdd-4673-9a59-cdc150afa43a" title="uptime.js" contentType="text/javascript">
module.exports = async (context) => {
  const { client, m, text, botname } = context;

  if (text) {
    return client.sendMessage(m.chat, { text: `◈━━━━━━━━━━━━━━━━◈\n│❒ What’s with the extra crap, ${m.pushName}? Just say !uptime, dumbass.` }, { quoted: m });
  }

  try {
    const formatUptime = (seconds) => {
      const days = Math.floor(seconds / (3600 * 24));
      const hours = Math.floor((seconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);

      const daysDisplay = days > 0 ? `${days} ${days === 1 ? 'day' : 'days'}, ` : '';
      const hoursDisplay = hours > 0 ? `${hours} ${hours === 1 ? 'hour' : 'hours'}, ` : '';
      const minutesDisplay = minutes > 0 ? `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}, ` : '';
      const secsDisplay = secs > 0 ? `${secs} ${secs === 1 ? 'second' : 'seconds'}` : '';

      return (daysDisplay + hoursDisplay + minutesDisplay + secsDisplay).replace(/,\s*$/, '');
    };

    const uptimeText = formatUptime(process.uptime());
    const replyText = `◈━━━━━━━━━━━━━━━━◈\n│❒ *${botname} Uptime, Bitches*\n\nI’ve been awake for *${uptimeText}*, running shit like a boss.\n\nPowered by *${botname}*`;

    await client.sendMessage(m.chat, { text: replyText }, { quoted: m });
  } catch (error) {
    console.error('Error in uptime command:', error);
    await client.sendMessage(m.chat, { text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, something’s fucked up with the uptime check. Try again later, loser.` }, { quoted: m });
  }
};