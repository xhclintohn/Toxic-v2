const axios = require("axios");
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
    const { client, m } = context;
    await ownerMiddleware(context, async () => {
        if (global.updateInProgress) {
            return await m.reply("🛑 *Yo, chill punk!* Update’s already running. Don’t spam me! 😡");
        }
        global.updateInProgress = true;

        try {
            await m.reply("💣 *Toxic-v2 Update Unleashed!* Scanning GitHub for fresh chaos... 😈");

            // Paths
            const lastCommitPath = path.join(__dirname, "../../last_commit.txt");
            const zipPath = path.join(__dirname, "../../update.zip");
            const extractPath = path.join(__dirname, "../../latest");
            const botRoot = path.join(__dirname, "../..");

            // Ensure directories exist
            if (!fs.existsSync(path.dirname(zipPath))) {
                fs.mkdirSync(path.dirname(zipPath), { recursive: true });
            }

            // 1. Check latest commit SHA
            console.log("Fetching latest commit...");
            const repoUrl = "https://api.github.com/repos/xhclintohn/Toxic-v2/commits/main";
            const { data: commitData } = await axios.get(repoUrl, {
                headers: { "User-Agent": "Toxic-v2-Bot" }
            }).catch(err => {
                throw new Error(`GitHub API error: ${err.response?.status || err.message}`);
            });
            const latestSha = commitData.sha;
            console.log(`Latest SHA: ${latestSha}`);

            // 2. Compare with stored SHA
            let currentSha = "";
            if (fs.existsSync(lastCommitPath)) {
                currentSha = fs.readFileSync(lastCommitPath, "utf-8").trim();
            }
            console.log(`Current SHA: ${currentSha}`);

            if (latestSha === currentSha) {
                return await m.reply("🛡️ *No updates, loser!* Toxic-v2 is already peak chaos. 🔥");
            }

            await m.reply("⚡ *New commits detected!* Downloading the mayhem...");

            // 3. Download ZIP
            console.log("Downloading ZIP...");
            const { data: zipData } = await axios.get("https://github.com/xhclintohn/Toxic-v2/archive/main.zip", {
                responseType: "arraybuffer"
            }).catch(err => {
                throw new Error(`Download failed: ${err.message}`);
            });
            fs.writeFileSync(zipPath, zipData);
            const stats = fs.statSync(zipPath);
            console.log(`ZIP downloaded: ${stats.size} bytes`);
            if (stats.size < 1000) throw new Error("ZIP file too small, likely corrupted");

            // 4. Extract ZIP
            await m.reply("🧨 *Unzipping the chaos...*");
            const zip = new AdmZip(zipPath);
            zip.extractAllTo(extractPath, true);
            console.log(`Extracted to ${extractPath}`);

            // 5. Copy files, preserving specific files
            await m.reply("🔄 *Replacing files, keeping your precious configs safe...*");
            const sourcePath = path.join(extractPath, "Toxic-v2");
            copyFolderSync(sourcePath, botRoot);

            // 6. Save new SHA
            console.log("Saving new SHA:", latestSha);
            fs.writeFileSync(lastCommitPath, latestSha);

            // 7. Cleanup
            console.log("Cleaning up...");
            fs.unlinkSync(zipPath);
            fs.rmSync(extractPath, { recursive: true, force: true });

            await m.reply(
                "😈 *Toxic-v2 updated! Dyno restarting in 3 seconds...* ⚠️ *Warning*: Heroku updates are temporary unless you push to git. Check logs for manual steps! 🔥"
            );

            // 8. Heroku dyno restart
            setTimeout(() => {
                console.log("Restarting Heroku dyno...");
                process.exit(0);
            }, 3000);

        } catch (error) {
            console.error("Update error:", error.stack);
            await m.reply(`💀 *Update crashed, weakling!* Error: ${error.message}. Check logs and fix it! 😡`);
        } finally {
            global.updateInProgress = false;
        }
    });
};

// Helper function to copy directories while preserving specific files
function copyFolderSync(source, target) {
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }

    const items = fs.readdirSync(source);
    for (const item of items) {
        const srcPath = path.join(source, item);
        const destPath = path.join(target, item);

        // Skip specific files and folders
        if (
            item === ".env" ||
            item === "Procfile" ||
            item === "package.json" ||
            item === "package-lock.json" ||
            item === "last_commit.txt" ||
            item === "Session" ||
            item === "node_modules"
        ) {
            console.log(`Skipping ${item} to preserve custom settings`);
            continue;
        }

        if (fs.lstatSync(srcPath).isDirectory()) {
            copyFolderSync(srcPath, destPath);
        } else {
            try {
                fs.copyFileSync(srcPath, destPath);
                console.log(`Copied ${srcPath} to ${destPath}`);
            } catch (e) {
                console.error(`Failed to copy ${srcPath}: ${e.message}`);
            }
        }
    }
}