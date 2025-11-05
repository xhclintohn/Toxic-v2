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
            await m.reply("📦 *Extracting files...*");
            const zip = new AdmZip(zipPath);
            zip.extractAllTo(extractPath, true);

            // The extracted folder will be "Toxic-v2-main" from your GitHub repo
            const sourcePath = path.join(extractPath, "Toxic-v2-main");

            if (!fs.existsSync(sourcePath)) {
                // List what's actually there for debugging
                const extractedItems = fs.readdirSync(extractPath);
                throw new Error(`Toxic-v2-main folder not found. Extracted items: ${extractedItems.join(', ')}`);
            }

            // Copy files (preserving configs)
            await m.reply("🔄 *Copying files...*");
            copyFolderSync(sourcePath, botRoot);

            // Save new SHA
            fs.writeFileSync(lastCommitPath, latestSha);

            // Cleanup
            fs.unlinkSync(zipPath);
            fs.rmSync(extractPath, { recursive: true, force: true });

            await m.reply("✅ *Update complete!* The bot will apply changes automatically. No restart needed! 🔥");

            // Don't restart on Heroku - just let the changes take effect
            // Heroku will automatically restart the dyno if needed

        } catch (error) {
            console.error("Update error:", error);
            await m.reply(`❌ *Update failed:* ${error.message}`);
        }
    });
};

// Helper function to copy files while preserving important ones
function copyFolderSync(source, target) {
    if (!fs.existsSync(source)) {
        throw new Error(`Source folder does not exist: ${source}`);
    }

    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }

    const items = fs.readdirSync(source);
    
    for (const item of items) {
        const srcPath = path.join(source, item);
        const destPath = path.join(target, item);

        // Skip important files and folders
        const skipItems = [".env", "Procfile", "package.json", "package-lock.json", "Session", "node_modules", "last_commit.txt"];
        if (skipItems.includes(item)) {
            console.log(`Skipping ${item}`);
            continue;
        }

        const stat = fs.lstatSync(srcPath);
        
        if (stat.isDirectory()) {
            copyFolderSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
            console.log(`Copied: ${item}`);
        }
    }
}