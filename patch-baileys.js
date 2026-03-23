"use strict";
const fs = require('fs');
const path = require('path');

const baileysBase = path.join(__dirname, 'node_modules', '@whiskeysockets', 'baileys', 'lib', 'Socket');
const msgSendPath = path.join(baileysBase, 'messages-send.js');
const usyncPath = path.join(baileysBase, 'usync.js');

if (!fs.existsSync(msgSendPath)) {
    console.log('[patch-baileys] messages-send.js not found, skipping');
    process.exit(0);
}

let msgSend = fs.readFileSync(msgSendPath, 'utf8');
let usync = fs.existsSync(usyncPath) ? fs.readFileSync(usyncPath, 'utf8') : null;

let changed = false;

if (!msgSend.includes('__LID_PATCH__')) {
    const oldLoop = 'jids = Array.from(new Set(jids))\n        for (let jid of jids) {\n            const user = WABinary_1.jidDecode(jid)?.user';
    const newLoop = 'jids = Array.from(new Set(jids))\n        for (let jid of jids) { /* __LID_PATCH__ */\n            const _d = WABinary_1.jidDecode(jid); if (_d?.server === \'lid\') continue;\n            const user = _d?.user';
    if (msgSend.includes(oldLoop.replace(/\\n/g, '\n'))) {
        msgSend = msgSend.replace(oldLoop.replace(/\\n/g, '\n'), newLoop.replace(/\\n/g, '\n'));
        console.log('[patch-baileys] Applied LID JID filter to getUSyncDevices');
        changed = true;
    } else {
        console.log('[patch-baileys] WARN: getUSyncDevices anchor not found, trying fallback');
        const altOld = 'const user = WABinary_1.jidDecode(jid)?.user\n            jid = WABinary_1.jidNormalizedUser(jid)';
        const altNew = 'const _d2 = WABinary_1.jidDecode(jid); /* __LID_PATCH__ */\n            if (_d2?.server === \'lid\') continue;\n            const user = _d2?.user\n            jid = WABinary_1.jidNormalizedUser(jid)';
        if (msgSend.includes(altOld.replace(/\\n/g, '\n'))) {
            msgSend = msgSend.replace(altOld.replace(/\\n/g, '\n'), altNew.replace(/\\n/g, '\n'));
            console.log('[patch-baileys] Applied LID JID filter (fallback anchor)');
            changed = true;
        }
    }
}

if (!msgSend.includes('__SKEY_PATCH__')) {
    const oldSKey = 'const [groupData, senderKeyMap] = await Promise.all([';
    const newSKey = 'let [groupData, senderKeyMap] = await Promise.all([ /* __SKEY_PATCH__ */';
    if (msgSend.includes(oldSKey)) {
        msgSend = msgSend.replace(oldSKey, newSKey);
        const oldAfter = ']);\n                if (!participant) {';
        const newAfter = ']);\n                if (groupData?.addressingMode === \'lid\') senderKeyMap = {};\n                if (!participant) {';
        if (msgSend.includes(oldAfter.replace(/\\n/g, '\n'))) {
            msgSend = msgSend.replace(oldAfter.replace(/\\n/g, '\n'), newAfter.replace(/\\n/g, '\n'));
            console.log('[patch-baileys] Applied senderKeyMap reset for LID groups');
            changed = true;
        }
    }
}

if (changed) {
    fs.writeFileSync(msgSendPath, msgSend);
    console.log('[patch-baileys] messages-send.js patched successfully');
}

if (usync && !usync.includes('__USYNC_TIMEOUT_PATCH__')) {
    const oldQuery = 'const result = await query(iq);';
    const newQuery = 'const result = await query(iq, 120000); /* __USYNC_TIMEOUT_PATCH__ */';
    if (usync.includes(oldQuery)) {
        usync = usync.replace(oldQuery, newQuery);
        fs.writeFileSync(usyncPath, usync);
        console.log('[patch-baileys] usync.js timeout increased to 120s');
    }
}

console.log('[patch-baileys] Done');
