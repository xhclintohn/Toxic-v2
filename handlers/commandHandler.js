const fs = require('fs');
const path = require('path');

const cmdsDir = path.join(__dirname, '..', 'plugins');

function findAllCommandFiles(dir) {
    let commandFiles = [];
    let totalCommands = 0;

    function findFiles(directory) {
        const files = fs.readdirSync(directory);
        for (const file of files) {
            const filePath = path.join(directory, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                findFiles(filePath);
            } else if (file.endsWith('.js')) {
                commandFiles.push(filePath);
                totalCommands++;
            }
        }
    }

    findFiles(dir);
    return { commandFiles, totalCommands };
}

const { commandFiles, totalCommands } = findAllCommandFiles(cmdsDir);

const commands = {};
const aliases = {
    speed: "ping",
    p: "ping",
    ev: "eval",
    xvideo: "xvideos",
    porn: "xvideos",
    bug: "crash",
    developer: "dev",
    get: "fetch",
    cmd: "getcmd",
    s: "sticker",
    m: "menu",

    d: "del",
    editimg: "imgedit",
    wormgpt: "darkgpt",
    worm: "darkgpt",
    whatmusic: "shazam",
    findmusic: "shazam",
    fmusic: "shazam",
    invite: "link",
    delete: "del",
    evl: "eval",
    k: "remove",
    ts: "telesticker",
    setprefix: "prefix",
    reactemoji: "reaction",
    autoviewstatus: "autoview",
    antimention: "antistatusmention",
    addowner: "addsudo",
    delowner: "delsudo",
    die: "block",
    pinmsg: "pin",
    unpin: "pin",
    clearchat: "clear",
    wipe: "clear",
    callprivacy: "callprivacy",
    callpriv: "callprivacy",
    msgprivacy: "messageprivacy",
    kick: "remove",
    mute: "close",
    unmute: "open",
    ssweb: "screenshot",
    ss: "screenshot",
    rvo: "vvx",
    pint: "pinterest",
    opengroup: "open",
    photo: "picture",
    pint: "pinterest",
    tophoto: "picture",
    latency: "ping",
    groupstatus: "gstatus",
    runtime: "uptime",
    admin: "oadmin",
    ghibli: "toghibli",
    groups: "botgc",
    bc: "broadcast",
    enhance: "remini",
    id: "checkid",
    cekid: "checkid",
    idch: "checkid",
    pp: "fullpp",
    kickall: "kill",
    kickall2: "kill2",
    exec: "shell",
    upscale: "remini",
    tohd: "remini",
    hd: "remini",
    leave: "leavegc",
    left: "leavegc",
    join: "joingc",
    git: "github",
    togroupstatus: "gstatus",
    ss: "screenshot",
    ssweb: "screenshot",
    getpp: "profile",
    allvars: "allvar",
    px: "ping",
    redeploy: "update",
    whois: "profile",
    ssweb: "ssweb",

    commands: "menu",
    list: "menu",
    owner: "dev",
    repo: "script",
    getmusic: "shazam",
    gmusic: "shazam",
    sc: "script",
    translate: "tr",
    trt: "tr",
    trigger: "triggerupdate",
    linkgc: "link",
    gclink: "link",
    grouplink: "link",
    linkgroup: "link",
    mention: "tagall",
    vv: "retrieve",
    k: "retrieve",
    search: "yts",
    youtubesearch: "yts",
    xd: "retrieve",
    vid: "alldl",
    reset: "revoke",
    mute: "close",
    app: "apk",
    fb: "fbdl",
    facebook: "fbdl",
    instagram: "igdl",
    ig: "igdl",
    rch: "xreact",
    img: "image",
    url: "upload",
    tourl: "upload",
    yta: "ytmp3",
    youtube: "ytmp4",
    tt: "tikdl",
    tiktok: "tikdl",
    twitter: "twtdl",
    x: "twtdl",
    bili: "bilibili",
    bvidl: "bilibili",
    snack: "snackvideo",
    sck: "snackvideo",
    mutegroup: "close",
    ai: "gpt",
    ytv: "ytmp4",
    mf: "mediafire",
    emojimix: "emix",
    chatbot: "chatbotpm",
    autoreply: "chatbotpm",
    toxicagent: "toxicai",
    devai: "toxicai",
    enc: "encrypt",
    req: "requests",
    approve: "approve-all",
    reject: "reject-all",
    up: "uptime",
    whoonline: "listonline",
    onlinemembers: "listonline",
    activemembers: "listonline",
    demoteuser: "demote",
    deadmin: "demote",
    promoteuser: "promote",
    makeadmin: "promote",
    addadmin: "promote",
    removemember: "remove",
    yeet: "remove",
    boot: "remove",
    isalive: "alive",
    botstatus: "alive",
    devcontact: "dev",
    creator: "dev",
    botsettings: "settings",
    mysettings: "settings",
    botconfig: "settings",
    pong: "ping",
    response: "ping",
    wc: "warncount",
    rw: "resetwarn",
    warns: "warncount",
    clearwarn: "resetwarn",
    swc: "setwarncount",
    setwarn: "setwarncount",
    warnlimit: "setwarncount",

    botmode: "mode",
    setmode: "mode",

    pall: "promoteall",
    dall: "demoteall",
    tagadminto: "tagadmins",
    calladmins: "tagadmins",
    ghupload: "upx",
    uploadmedia: "upx",
    tobase64: "base64",
    b64: "base64",
    encode64: "base64",
    unbase64: "base64decode",
    debase64: "base64decode",
    frombase64: "base64decode",
    decode64: "base64decode",
    b64decode: "base64decode",

    listgroup: "botgc",
    listgroups: "botgc",
    totalgroup: "botgc",
    tg: "botgc",
    lg: "botgc",
};

let _loadedCount = 0;
let _failedCount = 0;
commandFiles.forEach((file) => {
    const commandName = path.basename(file, '.js');
    try {
        const commandModule = require(file);
        const handler = commandModule.run || (typeof commandModule === 'function' ? commandModule : null);
        if (!handler) return;
        commands[commandName] = handler;
        _loadedCount++;
    } catch (err) {
        _failedCount++;
        console.log(`❌ [COMMANDHANDLER] Failed to load plugin: ${file}\n   Reason: ${err.message}`);
    }
});

const chalk = require('chalk');
console.log(chalk.green(`✔`) + chalk.white(` Loaded `) + chalk.cyan(`${_loadedCount}`) + chalk.white(` plugins`) + (_failedCount ? chalk.red(` (${_failedCount} failed)`) : chalk.gray(` • ${Object.keys(aliases).length} aliases registered`)));

module.exports = { commands, aliases, totalCommands };