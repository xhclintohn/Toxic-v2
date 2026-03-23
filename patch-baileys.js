"use strict";
const fs = require('fs');
const path = require('path');

const baileysBase = path.join(__dirname, 'node_modules', '@whiskeysockets', 'baileys', 'lib', 'Socket');
const usyncPath = path.join(baileysBase, 'usync.js');

if (!fs.existsSync(usyncPath)) {
    console.log('[patch-baileys] usync.js not found, skipping');
    process.exit(0);
}

let usync = fs.readFileSync(usyncPath, 'utf8');

if (!usync.includes('__USYNC_TIMEOUT_PATCH__')) {
    const oldQuery = 'const result = await query(iq);';
    const newQuery = 'const result = await query(iq, 120000); /* __USYNC_TIMEOUT_PATCH__ */';
    if (usync.includes(oldQuery)) {
        usync = usync.replace(oldQuery, newQuery);
        fs.writeFileSync(usyncPath, usync);
        console.log('[patch-baileys] usync.js timeout increased to 120s');
    } else {
        console.log('[patch-baileys] usync.js anchor not found, no patch applied');
    }
} else {
    console.log('[patch-baileys] usync.js already patched');
}

console.log('[patch-baileys] Done');
