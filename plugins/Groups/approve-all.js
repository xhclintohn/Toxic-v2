module.exports = async (context) => {
  const { client, m, chatUpdate, store, isBotAdmin, isAdmin } = context;

  if (!m.isGroup) {
    return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 Yo, dumbass, this command’s for groups only. Stop screwing around.`);
  }

  if (!isAdmin) {
    return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 Nice try, loser. You need admin powers to pull this off. Get lost.`);
  }

  if (!isBotAdmin) {
    return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 I ain’t got admin rights, moron. Make me admin or quit wasting my time.`);
  }

  const responseList = await client.groupRequestParticipantsList(m.chat);

  if (responseList.length === 0) {
    return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 What a surprise, no one’s begging to join this dumpster fire. No pending requests, idiot.`);
  }

  for (const participant of responseList) {
    try {
      const response = await client.groupRequestParticipantsUpdate(
        m.chat,
        [participant.jid],
        "approve"
      );
      console.log(response);
    } catch (error) {
      console.error('Error approving participant:', error);
      return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 Shit hit the fan, couldn’t approve @${participant.jid.split('@')[0]}. Fix your group, dumbass.`, { mentions: [participant.jid] });
    }
  }

  m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 Ugh, fine, all the desperate wannabes got approved. Happy now, you pest?`);
};