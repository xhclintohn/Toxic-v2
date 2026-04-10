/**
 * Translation middleware — patches client.sendMessage once per client instance.
 * When botlang is set to anything other than 'en', all outgoing text/caption
 * fields get translated automatically using Google Translate.
 */

const _patched = new WeakSet();

let _translate = null;
function getTranslate() {
    if (!_translate) {
        try { _translate = require('@vitalets/google-translate-api').translate; } catch {}
    }
    return _translate;
}

/**
 * @param {object} client - Baileys client
 * @param {function} getCachedSettings - sync function returning current settings object
 */
function applyTranslationPatch(client, getCachedSettings) {
    if (!client || _patched.has(client)) return;
    _patched.add(client);

    const orig = client.sendMessage.bind(client);

    client.sendMessage = async function (jid, content, opts) {
        if (!content || typeof content !== 'object') return orig(jid, content, opts);

        try {
            const settings = getCachedSettings();
            const lang = settings?.botlang;

            if (lang && lang !== 'en' && lang !== 'english') {
                const tr = getTranslate();
                if (!tr) return orig(jid, content, opts);

                if (typeof content.text === 'string' && content.text.trim()) {
                    const r = await tr(content.text, { to: lang }).catch(() => null);
                    if (r?.text) content = { ...content, text: r.text };
                }

                if (typeof content.caption === 'string' && content.caption.trim()) {
                    const r = await tr(content.caption, { to: lang }).catch(() => null);
                    if (r?.text) content = { ...content, caption: r.text };
                }
            }
        } catch {}

        return orig(jid, content, opts);
    };
}

module.exports = { applyTranslationPatch };
