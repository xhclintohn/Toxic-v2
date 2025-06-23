const axios = require("axios");
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
    const { client, m } = context;
    await ownerMiddleware(context, async () => {
        try {
            await m.reply("💣 *Toxic-v2 Update Check Launched!* Scanning for new commits... 😈");

            // Paths for Heroku
            const lastCommitPath = path.join(__dirname, "../../last_commit.txt");
            const zipPath = path.join(__dirname, "../../update.zip");
            const extractPath = path.join(__dirname, "../../update");

            // 1. Check latest commit SHA
            const repoUrl = "https://api.github.com/repos/xhclintohn/Toxic-v2/commits/main";
            const { data: commitData } = await axios.get(repoUrl, {
                headers: { "User-Agent": "Toxic-v2-Bot" }
            }).catch(err => {
                throw new Error(`GitHub API error: ${err.response?.status || err.message}`);
            });
            const latestSha = commitData.sha;

            // 2. Compare with stored SHA
            let lastSha = "";
            if (fs.existsSync(lastCommitPath)) {
                lastSha = fs.readFileSync(lastCommitPath, "utf-8").trim();
            }

            if (latestSha === lastSha) {
                return await m.reply("🛡️ *No new commits, loser!* Toxic-v2 is already the king. 🔥");
            }

            await m.reply("⚡ *Fresh commits found!* Downloading the chaos...");

            // 3. Download ZIP
            const writer = fs.createWriteStream(zipPath);
            const response = await axios({
                method: "get",
                url: "https://github.com/xhclintohn/Toxic-v2/archive/main.zip",
                responseType: "stream",
            }).catch(err => {
                throw new Error(`Download failed: ${err.message}`);
            });
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on("finish", () => {
                    console.log(`ZIP downloaded: ${fs.statSync(zipPath).size} bytes`);
                    resolve();
                });
                writer.on("error", reject);
            });

            // 4. Extract ZIP
            await m.reply("🧨 *Unpacking the madness...*");
            if (fs.existsSync(extractPath)) fs.rmSync(extractPath, { recursive: true });
            fs.mkdirSync(extractPath, { recursive: true });
            const zip = new AdmZip(zipPath);
            zip.extractAllTo(extractPath, true);

            // 5. Copy files
            await m.reply("💥 *Applying updates like a boss...*");
            const extractedFolders = fs.readdirSync(extractPath);
            const sourceFolder = extractedFolders.find(folder => folder.includes("Toxic-v2"));
            if (!sourceFolder) throw new Error("Update folder not found");

            copyFolderRecursiveSync(
                path.join(extractPath, sourceFolder),
                path.join(__dirname, "../.."),
                ["node_modules", "Session", ".env", "Procfile", "package.json", "last_commit.txt"]
            );

            // 6. Save new SHA
            fs.writeFileSync(lastCommitPath, latestSha);

            // 7. Cleanup
            fs.unlinkSync(zipPath);
            fs.rmSync(extractPath, { recursive: true });

            await m.reply("😈 *Toxic-v2 updated! Time to dominate!* Restarting dyno in 2 seconds...");

            // 8. Heroku dyno restart
            setTimeout(() => {
                console.log("Restarting Heroku dyno...");
                process.exit(0); // Heroku will restart the dyno
            }, 2000);

        } catch (error) {
            console.error("Update error:", error.stack);
            await m.reply(`💀 *Update failed, weakling!* Error: ${error.message}. Fix it or cry! 😡`);
        }
    });
};

// Recursive copy function
function copyFolderRecursiveSync(source, target, ignore = []) {
    if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });
    fs.readdirSync(source).forEach(item => {
        if (ignore.includes(item)) return;
        const srcPath = path.join(source, item);
        const destPath = path.join(target, item);
        if (fs.lstatSync(srcPath).isDirectory()) {
            copyFolderRecursiveSync(srcPath, destPath, ignore);
        } else {
            if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
            fs.copyFileSync(srcPath, destPath);
        }
    });
}