const axios = require("axios");
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m } = context;

        async function updateFromGitHub() {
            try {
                await m.reply("Downloading latest Toxic-v2 update...");
                
                // 1. Download ZIP
                const zipPath = path.join(__dirname, "../../update.zip");
                const writer = fs.createWriteStream(zipPath);
                const response = await axios({
                    method: "get",
                    url: "https://github.com/xhclintohn/Toxic-v2/archive/main.zip",
                    responseType: "stream",
                });
                response.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on("finish", resolve);
                    writer.on("error", reject);
                });

                // 2. Extract ZIP
                await m.reply("Extracting files...");
                const extractPath = path.join(__dirname, "../../update");
                const zip = new AdmZip(zipPath);
                zip.extractAllTo(extractPath, true);

                // 3. Find and copy files
                const extractedFolders = fs.readdirSync(extractPath);
                const sourceFolder = extractedFolders.find(folder => folder.includes("Toxic-v2"));
                if (!sourceFolder) throw new Error("Update folder not found");

                await m.reply("Applying updates...");
                copyFolderRecursiveSync(
                    path.join(extractPath, sourceFolder),
                    path.join(__dirname, "../.."),
                    ["node_modules", "config.cjs", ".env", "package.json"]
                );

                // 4. Cleanup
                fs.unlinkSync(zipPath);
                fs.rmSync(extractPath, { recursive: true });

                await m.reply("Update complete! Restarting...");
                setTimeout(() => process.exit(0), 2000);

            } catch (error) {
                await m.reply(`Update failed: ${error.message}`);
                console.error("Update error:", error);
            }
        }

        // Helper function (same as original)
        function copyFolderRecursiveSync(source, target, ignore = []) {
            if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });
            fs.readdirSync(source).forEach(item => {
                if (ignore.includes(item)) return;
                const srcPath = path.join(source, item);
                const destPath = path.join(target, item);
                if (fs.lstatSync(srcPath).isDirectory()) {
                    copyFolderRecursiveSync(srcPath, destPath, ignore);
                } else {
                    fs.copyFileSync(srcPath, destPath);
                }
            });
        }

        updateFromGitHub();
    });
};