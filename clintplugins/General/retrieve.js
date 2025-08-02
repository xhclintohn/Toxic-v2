module.exports = async (context) => {
    const { client, m } = context;

    if (!m.quoted) return;

    const quotedMessage = m.msg?.contextInfo?.quotedMessage;

    try {
        if (quotedMessage?.imageMessage) {
            const imageUrl = await client.downloadAndSaveMediaMessage(quotedMessage.imageMessage);
            await client.sendMessage(client.user.id, { 
                image: { url: imageUrl },
                caption: "Retrieved by Toxic-MD"
            });
        } 
        else if (quotedMessage?.videoMessage) {
            const videoUrl = await client.downloadAndSaveMediaMessage(quotedMessage.videoMessage);
            await client.sendMessage(client.user.id, {
                video: { url: videoUrl },
                caption: "Retrieved by Toxic-MD"
            });
        }
    } catch (error) {
       
    }
};