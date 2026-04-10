/**
 * Translation middleware — patches client.sendMessage ONCE per client instance.
 * Applied after full client setup. When botlang != 'en', all outgoing text
 * fields are translated automatically. Any error falls back to original send.
 */

const _patched = new WeakSet();
let _translate = null;

function getTranslate() {
    if (_translate) return _translate;
    try {
        const mod = require('@vitalets/google-translate-api');
        _translate = mod.translate || mod.default?.translate || null;
    } catch {}
    return _translate;
}

async function safeTr(text, lang) {
    try {
        const tr = getTranslate();
        if (!tr || typeof tr !== 'function') return text;
        const r = await tr(text, { to: lang });
        return (r && r.text) ? r.text : text;
    } catch {
        return text;
    }
}

function applyTranslationPatch(client, getCachedSettings) {
    if (!client || typeof client !== 'object') return;
    if (!client.sendMessage || typeof client.sendMessage !== 'function') return;
    if (_patched.has(client)) return;
    _patched.add(client);

    const orig = client.sendMessage.bind(client);

    client.sendMessage = async function patchedSendMessage(jid, content, opts) {
        try {
            if (content && typeof content === 'object') {
                const s = getCachedSettings ? getCachedSettings() : null;
                const lang = s && typeof s === 'object' ? s.botlang : null;

                if (lang && lang !== 'en' && lang !== 'english') {
                    if (typeof content.text === 'string' && content.text.trim().length > 0) {
                        const translated = await safeTr(content.text, lang);
                        content = { ...content, text: translated };
                    }
                    if (typeof content.caption === 'string' && content.caption.trim().length > 0) {
                        const translated = await safeTr(content.caption, lang);
                        content = { ...content, caption: translated };
                    }
                }
            }
        } catch (err) {
            console.error('❌ [TRANSLATOR]:', err.message);
        }
        return orig(jid, content, opts);
    };
}

module.exports = { applyTranslationPatch };
