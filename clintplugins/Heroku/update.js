const axios = require("axios");
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const { execSync } = require("child_process");
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
    const { client, m } = context;
    await ownerMiddleware(context, async () => {
        // Prevent multiple executions
        if (global.updateInProgress) {
            return await m.reply("🛑 *Hold up, punk!* Update already in progress. Wait your turn! 😡");
        }
        global.updateInProgress = true;

        try {
            await m.reply("💣 *Toxic-v2 Update Check Unleashed!* Scanning for new commits... 😈");

            // Paths
            const lastCommitPath = path.join(__dirname, "../../last_commit.txt");
            const zipPath = path.join(__dirname, "../../update.zip");
            const botRoot = path.join(__dirname, "../.."); // Toxic-v2 root

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
                return await m.reply("🛡️ *No new commits, loser!* Toxic-v2 is already at peak chaos. 🔥").finally(() => {
                    global.updateInProgress = false;
                });
            }

            await m.reply("⚡ *New commits detected!* Downloading the mayhem...");

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

            // 4. Extract ZIP directly to bot root
            await m.reply("🧨 *Unzipping the chaos to Toxic-v2 root...*");
            const zip = new AdmZip(zipPath);
            const zipEntries = zip.getEntries();
            zipEntries.forEach(entry => {
                // Skip entries in excluded directories or files
                const entryPath = entry.entryName;
                if (
                    entryPath.includes("node_modules/") ||
                    entryPath.includes("Session/") ||
                    entryPath === "Toxic-v2-main/.env" ||
                    entryPath === "Toxic-v2-main/Procfile" ||
                    entryPath === "Toxic-v2-main/package.json" ||
                    entryPath === "Toxic-v2-main/package-lock.json" ||
                    entryPath === "Toxic-v2-main/last_commit.txt"
                ) {
                    return;
                }

                // Extract to bot root, removing "Toxic-v2-main/" prefix
                const relativePath = entryPath.replace("Toxic-v2-main/", "");
                const destPath = path.join(botRoot, relativePath);
                if (entry.isDirectory) {
                    if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
                } else {
                    if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
                    zip.extractEntryTo(entry, path.dirname(destPath), false, true);
                }
            });

            // 5. Save new SHA
            fs.writeFileSync(lastCommitPath, latestSha);

            // 6. Cleanup
            fs.unlinkSync(zipPath);

            // 7. Commit and push to Heroku
            await m.reply("📡 *Committing updates to Heroku like a boss...*");
            try {
                execSync("git add .", { cwd: botRoot });
                execSync(`git commit -m "Auto-update Toxic-v2 to commit ${latestSha}"`, { cwd: botRoot });
                execSync("git push heroku main", { cwd: botRoot });
            } catch (gitError) {
                throw new Error(`Git operation failed: ${gitError.message}`);
            }

            await m.reply("😈 *Toxic-v2 updated! Ready to dominate!* Restarting dyno in 2 seconds...");

            // 8. Heroku dyno restart
            setTimeout(() => {
                console.log("Restarting Heroku dyno...");
                process.exit(0); // Heroku will restart the dyno
            }, 2000);

        } catch (error) {
            console.error("Update error:", error.stack);
            await m.reply(`💀 *Update crashed, weakling!* Error: ${error.message}. Fix it or cry! 😡`);
        } finally {
            global.updateInProgress = false;
        }
    });
};