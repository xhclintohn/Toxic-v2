const fs = require('fs');
const path = require('path');
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m } = context;

        const formatStylishReply = (message) => {
            return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈\n> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ`;
        };

        try {
            // Correct session directory path
            const sessionsDir = path.join(__dirname, '../../Session');
            
            // Check if sessions directory exists
            if (!fs.existsSync(sessionsDir)) {
                return await client.sendMessage(
                    m.chat,
                    { text: formatStylishReply("❌ Sessions directory not found!\nPath: ../../Session\nWhere the fuck are your session files, boss?") },
                    { quoted: m, ad: true }
                );
            }

            // Read directory
            const files = fs.readdirSync(sessionsDir);
            
            // Filter session files - matching your original pattern
            const sessionFiles = files.filter(item => 
                item.startsWith("pre-key") ||
                item.startsWith("sender-key") ||
                item.startsWith("sessions-") ||
                item.startsWith("session-") ||
                item.startsWith("app-state") ||
                item.startsWith("auth_info") ||
                item.includes("pre-key") ||
                item.includes("sender-key") ||
                item.includes("session")
            );

            const fileCount = sessionFiles.length;
            
            if (fileCount === 0) {
                return await client.sendMessage(
                    m.chat,
                    { text: formatStylishReply("✅ No session trash found!\n\nSession folder is cleaner than your browser history, boss. 😎") },
                    { quoted: m, ad: true }
                );
            }

            // Send initial message with file list
            await client.sendMessage(
                m.chat,
                { text: formatStylishReply(`🗑️ *CLEANING SESSION CACHE*\n\nFound ${fileCount} dirty session files:\n${sessionFiles.slice(0, 10).map(f => `• ${f}`).join('\n')}${fileCount > 10 ? `\n...and ${fileCount - 10} more files` : ''}\n\nGetting ready to trash this shit... 🔥`) },
                { quoted: m, ad: true }
            );

            // Delete files one by one
            let deletedCount = 0;
            let failedCount = 0;
            const failedFiles = [];
            
            for (const file of sessionFiles) {
                try {
                    const filePath = path.join(sessionsDir, file);
                    
                    // Check if it's a file or directory
                    const stat = fs.statSync(filePath);
                    if (stat.isFile()) {
                        fs.unlinkSync(filePath);
                        console.log(`✅ Deleted file: ${file}`);
                    } else if (stat.isDirectory()) {
                        // Remove directory recursively
                        fs.rmSync(filePath, { recursive: true, force: true });
                        console.log(`✅ Deleted directory: ${file}`);
                    }
                    deletedCount++;
                } catch (err) {
                    console.error(`❌ Failed to delete ${file}:`, err.message);
                    failedCount++;
                    failedFiles.push(file);
                }
            }

            // Send completion message
            let resultMessage = `✅ *SESSION CLEANUP COMPLETE!*\n\n` +
                               `🗑️ *Deleted:* ${deletedCount} files/dirs\n` +
                               `❌ *Failed:* ${failedCount} items\n` +
                               `📁 *Total scanned:* ${fileCount} items\n\n`;
            
            if (failedCount > 0) {
                resultMessage += `📛 *Failed items:*\n${failedFiles.slice(0, 5).map(f => `• ${f}`).join('\n')}`;
                if (failedFiles.length > 5) resultMessage += `\n...and ${failedFiles.length - 5} more`;
                resultMessage += `\n\n⚠️ Some files/dirs were locked or in use.\n💡 Try again after restarting the bot.`;
            } else {
                resultMessage += `♻️ All session trash cleared successfully!\n🔄 *Restart bot* for fresh sessions.\n🔥 Cache has been nuked!`;
            }

            await client.sendMessage(
                m.chat,
                { text: formatStylishReply(resultMessage) },
                { quoted: m, ad: true }
            );

        } catch (error) {
            console.error("ClearSesi Error:", error);
            
            await client.sendMessage(
                m.chat,
                { text: formatStylishReply(`❌ FUCK! Error clearing sessions:\n\nError: ${error.message}\nPath: ../../Session\n\nCheck if directory exists, boss.`) },
                { quoted: m, ad: true }
            );
        }
    });
};