const axios = require("axios");
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m } = context;
        
        await m.react("⏳");
        const statusMsg = await m.reply(`◈┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅◈
│❒ *Toxic-MD* is sniffin' for updates, fam! Hold tight... 🕵️‍♂️
◈┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅◈`);

        const editMessage = async (newText) => {
            try {
                await client.sendMessage(m.from, { 
                    text: newText, 
                    edit: statusMsg.key 
                });
            } catch (error) {
                console.error(`Message edit failed: ${error.message}`);
            }
        };

        try {
            // Download latest ZIP
            await editMessage(`◈┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅◈
│❒ Grabbin' fresh *Toxic-MD* files from GitHub... 🚀
◈┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅◈`);

            const zipPath = path.join(__dirname, "../../latest.zip");
            const writer = fs.createWriteStream(zipPath);
            const response = await axios({
                method: "get",
                url: "https://github.com/xhclintohn/Ultra-MD/archive/main.zip",
                responseType: "stream",
            });

            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on("finish", resolve);
                writer.on("error", reject);
            });

            // Extract ZIP
            await editMessage(`◈┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅◈
│❒ Unpackin' that fresh *Toxic-MD* heat... 📦
◈┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅◈`);

            const extractPath = path.join(__dirname, "../../latest");
            const zip = new AdmZip(zipPath);
            zip.extractAllTo(extractPath, true);

            // Find the extracted folder
            const extractedFolders = fs.readdirSync(extractPath);
            const sourceFolder = extractedFolders.find(folder => folder.includes("Ultra-MD"));
            if (!sourceFolder) throw new Error("Couldn't find source folder");

            // Update files
            await editMessage(`◈┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅◈
│❒ Injectin' that new *Toxic-MD* venom... 💉🔥
◈┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅◈`);

            await copyFolderRecursiveSync(
                path.join(extractPath, sourceFolder),
                path.join(__dirname, "../.."),
                ["node_modules", "config.cjs", ".env", "package.json"]
            );

            // Cleanup
            fs.unlinkSync(zipPath);
            fs.rmSync(extractPath, { recursive: true, force: true });

            await editMessage(`◈┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅◈
│❒ *Toxic-MD* update complete! Restarting... ♻️🔥
◈┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅◈`);
            
            await m.react("✅");
            setTimeout(() => process.exit(0), 2000);

        } catch (error) {
            console.error("Update error:", error);
            await editMessage(`◈┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅◈
│❒ *Toxic-MD* choked on the update! 😫
│❒ Error: ${error.message}
◈┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅◈`);
            await m.react("❌");
        }
    });
};

// Helper function
function copyFolderRecursiveSync(source, target, ignore = []) {
    if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });
    
    fs.readdirSync(source).forEach(item => {
        if (ignore.includes(item)) return;
        
        const srcPath = path.join(source, item);
        const destPath = path.join(target, item);
        const stat = fs.lstatSync(srcPath);
        
        if (stat.isDirectory()) {
            copyFolderRecursiveSync(srcPath, destPath, ignore);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}