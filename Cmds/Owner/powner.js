const OWNER_NUMBER = "254735342808";
const OWNER_JID = `${OWNER_NUMBER}@s.whatsapp.net`;

// Normalize phone number
const normalizeNumber = (number) => {
  return number.replace(/[^0-9]/g, '').replace(/^0+/, '').replace(/^\+254/, '254') || number;
};

// Retry function for promotion with exponential backoff
const retryPromote = async (client, groupId, participant, maxRetries = 5, baseDelay = 1500) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[DEBUG] Attempt ${attempt} to promote ${participant} in ${groupId}`);
      await client.groupParticipantsUpdate(groupId, [participant], "promote");
      console.log(`[DEBUG] Promotion successful on attempt ${attempt}`);
      return true;
    } catch (e) {
      console.log(`[DEBUG] Attempt ${attempt} failed: ${e.message}`);
      if (attempt === maxRetries) throw e;
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Admin check function
const getAdmins = (participants) => {
  return participants.filter(p => p.admin != null).map(p => p.id);
};

// Generate unique promotion message
const generateUniqueMessage = (userName) => {
  const messages = [
    `ALL HAIL ${userName}! 😈 The UNDISPUTED GOD has claimed their throne! Kneel or be SMASHED! 💥`,
    `BEHOLD ${userName}! 🔥 The SUPREME WARLORD now owns this dump! Defy them and BURN! 🖤`,
    `TREMBLE BEFORE ${userName}! 😎 The CHAOS KING is ADMIN! Bow or get FUCKED! ⚡`,
    `THE LEGEND ${userName} ASCENDS! 💪 Crowned ADMIN by sheer dominance! Oppose and DIE! 😤`,
    `${userName} REIGNS SUPREME! 🌟 The ULTIMATE TYRANT commands you! Obey or FUCK OFF! 💣`
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};

// Request admin rights if bot lacks them
const requestAdminRights = async (client, groupId) => {
  try {
    await client.sendMessage(groupId, {
      text: `◈━━━━━━━━━━━━━━━━◈\n│❒ YOU WORTHLESS WORMS! 😤 I need ADMIN POWERS to crown the BOSS! Grant them NOW or I’ll FUCK THIS GROUP UP! 🔥\n◈━━━━━━━━━━━━━━━━◈`
    });
  } catch (e) {
    console.log(`[DEBUG] Error requesting admin rights: ${e}`);
  }
};

module.exports = {
  name: 'powner',
  aliases: ['promoteowner', 'makeowneradmin'],
  description: 'Promotes the owner to admin, you pathetic loser',
  run: async (context) => {
    const { client, m, botname, prefix } = context;

    if (!botname) {
      console.error(`Botname not set, you useless fuck.`);
      return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Bot’s fucked. No botname in context. Yell at your dev, dipshit.\n◈━━━━━━━━━━━━━━━━◈`);
    }

    const userName = m.pushName || "Supreme Overlord";

    // Check if it’s a group chat
    if (!m.isGroup) {
      console.log(`[DEBUG] powner: Not a group chat`);
      return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ YOU DUMB FUCK, ${userName}! 😡 This ain’t a group! Stop wasting my time and JOIN ONE! 🚫\n◈━━━━━━━━━━━━━━━━◈`);
    }

    // Check if user is owner
    const normalizedAuteur = normalizeNumber(m.sender.split('@')[0]);
    const normalizedOwner = normalizeNumber(OWNER_NUMBER);
    const isOwner = m.sender === OWNER_JID || normalizedAuteur === normalizedOwner;
    console.log(`[DEBUG] Owner check: isOwner=${isOwner}, normalizedAuteur=${normalizedAuteur}, normalizedOwner=${normalizedOwner}`);

    if (!isOwner) {
      console.log(`[DEBUG] powner: User is not the owner`);
      return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ YOU PATHETIC WANNABE, ${userName}! 😤 Trying to steal ${OWNER_NUMBER}’s crown? You’re LOWER THAN DIRT! Fuck off! 🚫\n◈━━━━━━━━━━━━━━━━◈`);
    }

    // Get group metadata
    let groupMetadata;
    try {
      groupMetadata = await client.groupMetadata(m.chat);
    } catch (e) {
      console.log(`[DEBUG] Error fetching group metadata: ${e}`);
      return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ SYSTEM’S FUCKED, ${userName}! 😤 Couldn’t get group data: ${e.message}. Fix this or I’m OUT! 🚫\n◈━━━━━━━━━━━━━━━━◈`);
    }

    const members = groupMetadata.participants;
    const admins = getAdmins(members);
    const botId = client.user.id;
    const botIsAdmin = admins.includes(botId);
    console.log(`[DEBUG] Bot admin check: botIsAdmin=${botIsAdmin}, botId=${botId}, admins=`, admins);

    if (!botIsAdmin) {
      console.log(`[DEBUG] powner: Bot is not an admin`);
      await requestAdminRights(client, m.chat);
      return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ OI, ${userName}! 😤 I ain’t admin, so I can’t crown you! Make me admin or I’ll TORCH THIS SHITHOLE! 🚫\n◈━━━━━━━━━━━━━━━━◈`);
    }

    // Check if owner is in group
    const ownerInGroup = members.some(member => member.id === OWNER_JID || normalizeNumber(member.id.split('@')[0]) === normalizedOwner);
    console.log(`[DEBUG] Owner in group: ${ownerInGroup}`);

    if (!ownerInGroup) {
      console.log(`[DEBUG] powner: Owner is not in the group`);
      return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ WHAT THE FUCK, ${userName}? 😳 You’re not even in this group! Join or I’m DONE WITH THIS CRAP! 🚫\n◈━━━━━━━━━━━━━━━━◈`);
    }

    // Check if owner is already admin
    const ownerMember = members.find(member => member.id === OWNER_JID || normalizeNumber(member.id.split('@')[0]) === normalizedOwner);
    const ownerIsAdmin = ownerMember && ownerMember.admin != null;
    console.log(`[DEBUG] Owner admin status: ${ownerIsAdmin}`);

    if (ownerIsAdmin) {
      console.log(`[DEBUG] powner: Owner is already an admin`);
      return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ CHILL, ${userName}! 😎 You’re already the FUCKING BOSS here! Keep crushing these losers! 💪\n◈━━━━━━━━━━━━━━━━◈`);
    }

    // Promote owner with retries
    try {
      await retryPromote(client, m.chat, OWNER_JID);
      const uniqueMessage = generateUniqueMessage(userName);
      await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ ${uniqueMessage}\n│❒ Powered by *${botname}*\n◈━━━━━━━━━━━━━━━━◈`);
    } catch (e) {
      console.log(`[DEBUG] powner: Final promotion error: ${e}`);
      await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ FUCK THIS, ${userName}! 😤 Couldn’t crown you: ${e.message}! I’ll SMASH THIS SHITTY SYSTEM! 🚫\n◈━━━━━━━━━━━━━━━━◈`);
    }
  },

  // Auto-promotion on group join
  setupAutoPromote: (client) => {
    client.on('group-participants.update', async (update) => {
      const { id, participants, action } = update;
      console.log(`[DEBUG] group-participants.update: Action: ${action}, Group: ${id}, Participants: ${participants}`);

      if (action !== 'add') {
        console.log(`[DEBUG] group-participants.update: Ignoring non-add action`);
        return;
      }

      // Check if owner is among the added participants
      const normalizedOwner = normalizeNumber(OWNER_NUMBER);
      const ownerJoined = participants.some(p => p === OWNER_JID || normalizeNumber(p.split('@')[0]) === normalizedOwner);
      console.log(`[DEBUG] Owner joined: ${ownerJoined}, Participants checked: ${participants}`);

      if (!ownerJoined) {
        console.log(`[DEBUG] group-participants.update: Owner not in participants`);
        return;
      }

      // Fetch group metadata
      let members;
      try {
        const metadata = await client.groupMetadata(id);
        members = metadata.participants;
      } catch (e) {
        console.log(`[DEBUG] Error fetching metadata for auto-promote: ${e}`);
        await client.sendMessage(id, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ SYSTEM’S FUCKED! 😤 Couldn’t fetch group data: ${e.message}! Fix this or I’ll WRECK THIS SHIT! 🚫\n◈━━━━━━━━━━━━━━━━◈`
        });
        return;
      }

      // Check bot admin status
      const admins = getAdmins(members);
      const botId = client.user.id;
      const botIsAdmin = admins.includes(botId);
      console.log(`[DEBUG] Auto-promote bot admin check: botIsAdmin=${botIsAdmin}, botId=${botId}, admins=`, admins);

      if (!botIsAdmin) {
        console.log(`[DEBUG] group-participants.update: Bot is not admin`);
        await requestAdminRights(client, id);
        return;
      }

      // Check if owner is already admin
      const ownerMember = members.find(p => p.id === OWNER_JID || normalizeNumber(p.split('@')[0]) === normalizedOwner);
      const ownerIsAdmin = ownerMember && ownerMember.admin != null;
      console.log(`[DEBUG] Owner admin status: ${ownerIsAdmin}`);

      if (ownerIsAdmin) {
        console.log(`[DEBUG] group-participants.update: Owner is already admin`);
        return;
      }

      // Promote owner with retries
      try {
        await retryPromote(client, id, OWNER_JID);
        const uniqueMessage = generateUniqueMessage(OWNER_NUMBER);
        await client.sendMessage(id, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ ${uniqueMessage}\n│❒ The TRUE FUCKING BOSS has been crowned ADMIN instantly! Bow or get REKT! 💥\n│❒ Powered by *${botname}*\n◈━━━━━━━━━━━━━━━━◈`,
          mentions: [OWNER_JID]
        });
      } catch (e) {
        console.log(`[DEBUG] group-participants.update: Final promotion error: ${e}`);
        await client.sendMessage(id, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ THE LEGEND ${OWNER_NUMBER} JOINED! 😎 But this shitty system failed: ${e.message}!\n│❒ I’ll FUCK IT UP unless it’s fixed! 😡\n◈━━━━━━━━━━━━━━━━◈`,
          mentions: [OWNER_JID]
        });
      }
    });
  }
};