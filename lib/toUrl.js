const axios = require('axios');
const FormData = require('form-data');
const { fromBuffer } = require('file-type');
const fs = require('fs');
const cheerio = require('cheerio');

async function _getExt(buf, hint) {
    let ext = hint || '';
    if (ext && ext.includes('.')) ext = ext.split('.').pop().split('?')[0];
    if (!ext || ext.length > 10) {
        try { const t = await fromBuffer(buf); if (t) ext = t.ext; } catch {}
    }
    return ext || 'bin';
}

async function uploadToUrl(buffer, extOrFilename) {
    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    const ext = await _getExt(buf, extOrFilename);
    const filename = `upload_${Date.now()}.${ext}`;
    const errors = [];

    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const form = new FormData();
            form.append('reqtype', 'fileupload');
            form.append('fileToUpload', buf, { filename, contentType: 'application/octet-stream' });
            const res = await axios.post('https://catbox.moe/user/api.php', form, {
                headers: form.getHeaders(),
                timeout: 30000,
                maxContentLength: 256 * 1024 * 1024
            });
            const url = typeof res.data === 'string' ? res.data.trim() : '';
            if (url.startsWith('http')) return url;
            throw new Error('bad response: ' + url.slice(0, 60));
        } catch (e) {
            errors.push('catbox[' + attempt + ']: ' + e.message);
            if (attempt < 1) await new Promise(r => setTimeout(r, 1500));
        }
    }

    try {
        const form = new FormData();
        form.append('files[]', buf, { filename, contentType: 'application/octet-stream' });
        const res = await axios.post('https://pomf2.lain.la/upload.php', form, {
            headers: form.getHeaders(),
            timeout: 30000
        });
        const url = res.data?.files?.[0]?.url;
        if (url) return url;
        throw new Error('no url in response');
    } catch (e) {
        errors.push('pomf2: ' + e.message);
    }

    throw new Error('uploadToUrl failed: ' + errors.join(' | '));
}

async function uploadTempUrl(buffer, extOrFilename) {
    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    const ext = await _getExt(buf, extOrFilename);
    const filename = `tmp_${Date.now()}.${ext}`;
    const errors = [];

    try {
        const form = new FormData();
        form.append('files[]', buf, { filename, contentType: 'application/octet-stream' });
        const res = await axios.post('https://qu.ax/upload.php', form, {
            headers: form.getHeaders(),
            timeout: 20000
        });
        const url = res.data?.files?.[0]?.url;
        if (url && url.startsWith('http')) return url;
        throw new Error('no url');
    } catch (e) {
        errors.push('qu.ax: ' + e.message);
    }

    try {
        const form = new FormData();
        form.append('file', buf, { filename, contentType: 'application/octet-stream' });
        const res = await axios.post('https://0x0.st', form, {
            headers: form.getHeaders(),
            timeout: 20000
        });
        const url = typeof res.data === 'string' ? res.data.trim() : '';
        if (url.startsWith('http')) return url;
        throw new Error('invalid response');
    } catch (e) {
        errors.push('0x0.st: ' + e.message);
    }

    try {
        const form = new FormData();
        form.append('file', buf, { filename, contentType: 'application/octet-stream' });
        const res = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
            headers: form.getHeaders(),
            timeout: 20000
        });
        const url = res.data?.data?.url;
        if (url) return url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
        throw new Error('no url');
    } catch (e) {
        errors.push('tmpfiles: ' + e.message);
    }

    return uploadToUrl(buffer, extOrFilename);
}

function webp2mp4File(path) {
    return new Promise((resolve, reject) => {
        const form = new FormData();
        form.append('new-image-url', '');
        form.append('new-image', fs.createReadStream(path));
        axios({
            method: 'post',
            url: 'https://s6.ezgif.com/webp-to-mp4',
            data: form,
            headers: { 'Content-Type': `multipart/form-data; boundary=${form._boundary}` }
        }).then(({ data }) => {
            const form2 = new FormData();
            const $ = cheerio.load(data);
            const file = $('input[name="file"]').attr('value');
            form2.append('file', file);
            form2.append('convert', 'Convert WebP to MP4!');
            axios({
                method: 'post',
                url: 'https://ezgif.com/webp-to-mp4/' + file,
                data: form2,
                headers: { 'Content-Type': `multipart/form-data; boundary=${form2._boundary}` }
            }).then(({ data: d }) => {
                const $2 = cheerio.load(d);
                const result = 'https:' + $2('div#output > p.outfile > video > source').attr('src');
                resolve({ status: true, result });
            }).catch(reject);
        }).catch(reject);
    });
}

async function TelegraPh(input) {
    const buf = Buffer.isBuffer(input) ? input : fs.readFileSync(input);
    return uploadTempUrl(buf, typeof input === 'string' ? input : 'bin');
}

async function UploadFileUgu(input) {
    const buf = Buffer.isBuffer(input) ? input : fs.readFileSync(input);
    return uploadTempUrl(buf, typeof input === 'string' ? input : 'bin');
}

module.exports = { uploadToUrl, uploadTempUrl, webp2mp4File, TelegraPh, UploadFileUgu };
