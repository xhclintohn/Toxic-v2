const axios = require("axios");
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
    const { client, m } = context;
    await ownerMiddleware(context, async () => {
        try {
            await m.reply("🔍 *Checking for updates...*");

            // Path to store last commit
            const lastCommitPath = path.join(__dirname, "../../last_commit.txt");

            // 1. Check latest commit SHA from GitHub
            const repoUrl = "https://api.github.com/repos/xhclintohn/Toxic-v2/commits/main";
            const { data: commitData } = await axios.get(repoUrl, {
                headers: { "User-Agent": "Toxic-v2-Bot" }
            });
            
            const latestSha = commitData.sha;

            // 2. Compare with stored SHA
            let currentSha = "";
            if (fs.existsSync(lastCommitPath)) {
                currentSha = fs.readFileSync(lastCommitPath, "utf-8").trim();
            }

            if (latestSha === currentSha) {
                return await m.reply("✅ *No updates available!* Your Toxic-v2 is already up to date. 🔥");
            }

            await m.reply("🔄 *Update found!* Downloading latest version...");

            // 3. Download and extract update
            const zipPath = path.join(__dirname, "../../update.zip");
            const extractPath = path.join(__dirname, "../../latest");
            const botRoot = path.join(__dirname, "../..");

            // Download ZIP
            const { data: zipData } = await axios.get("https://github.com/xhclintohn/Toxic-v2/archive/main.zip", {
                responseType: "arraybuffer"
            });
            
            fs.writeFileSync(zipPath, zipData);

            // Extract ZIP
            const zip = new AdmZip(zipPath);
            zip.extractAllTo(extractPath, true);

            // Copy files (preserving configs)
            const sourcePath = path.join(extractPath, "Toxic-v2");
            copyFolderSync(sourcePath, botRoot);

            // Save new SHA
            fs.writeFileSync(lastCommitPath, latestSha);

            // Cleanup
            fs.unlinkSync(zipPath);
            fs.rmSync(extractPath, { recursive: true, force: true });

            await m.reply("✅ *Update complete!* Restarting bot...");

            // Restart after delay
            setTimeout(() => {
                process.exit(0);
            }, 3000);

        } catch (error) {
            console.error("Update error:", error);
            await m.reply(`❌ *Update failed:* ${error.message}`);
        }
    });
};

// Helper function to copy files while preserving important ones
function copyFolderSync(source, target) {
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }

    const items = fs.readdirSync(source);
    for (const item of items) {
        const srcPath = path.join(source, item);
        const destPath = path.join(target, item);

        // Skip important files
        if ([".env", "Procfile", "package.json", "Session", "node_modules"].includes(item)) {
            console.log(`Skipping ${item}`);
            continue;
        }

        if (fs.lstatSync(srcPath).isDirectory()) {
            copyFolderSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}