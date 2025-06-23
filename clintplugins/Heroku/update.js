const axios = require("axios");
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
    console.log("Update command triggered with context:", context);
    await ownerMiddleware(context, async () => {
        const { client, m } = context;
        console.log("Passed owner middleware");

        async function updateFromGitHub() {
            try {
                console.log("Starting update process...");
                await m.reply("Downloading latest Toxic-v2 update...");

                // 1. Download ZIP
                const zipPath = path.join(__dirname, "../../update.zip");
                console.log("ZIP path:", zipPath);
                const writer = fs.createWriteStream(zipPath);
                const response = await axios({
                    method: "get",
                    url: "https://github.com/xhclintohn/Toxic-v2/archive/main.zip",
                    responseType: "stream",
                }).catch(err => {
                    throw new Error(`Axios error: ${err.message}`);
                });
                response.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on("finish", () => {
                        console.log("ZIP download complete, size:", fs.statSync(zipPath).size);
                        resolve();
                    });
                    writer.on("error", reject);
                });

                // 2. Extract ZIP
                await m.reply("Extracting files...");
                const extractPath = path.join(__dirname, "../../update");
                console.log("Extract path:", extractPath);
                if (!fs.existsSync(extractPath)) fs.mkdirSync(extractPath, { recursive: true });
                const zip = new AdmZip(zipPath);
                zip.extractAllTo(extractPath, true);
                console.log("Extraction complete");

                // 3. Find and copy files
                const extractedFolders = fs.readdirSync(extractPath);
                console.log("Extracted folders:", extractedFolders);
                const sourceFolder = extractedFolders.find(folder => folder.includes("Toxic-v2"));
                if (!sourceFolder) throw new Error("Update folder not found");
                await m.reply("Applying updates...");
                copyFolderRecursiveSync(
                    path.join(extractPath, sourceFolder),
                    path.join(__dirname, "../.."),
                    ["node_modules", "config.cjs", ".env", "package.json"]
                );
                console.log("File copy complete");

                // 4. Cleanup
                fs.unlinkSync(zipPath);
                fs.rmSync(extractPath, { recursive: true });
                console.log("Cleanup complete");

                await m.reply("Update complete! Restarting...");
                setTimeout(() => process.exit(0), 2000);

            } catch (error) {
                console.error("Update error:", error.stack);
                await m.reply(`Update failed: ${error.message}\nStack: ${error.stack}`);
            }
        }

        function copyFolderRecursiveSync(source, target, ignore = []) {
            if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });
            fs.readdirSync(source).forEach(item => {
                if (ignore.includes(item)) return;
                const srcPath = path.join(source, item);
                const destPath = path.join(target, item);
                console.log(`Copying: ${srcPath} -> ${destPath}`);
                if (fs.lstatSync(srcPath).isDirectory()) {
                    copyFolderRecursiveSync(srcPath, destPath, ignore);
                } else {
                    if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
                    fs.copyFileSync(srcPath, destPath);
                }
            });
        }

        await updateFromGitHub();
    });
};