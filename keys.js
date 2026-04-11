const _defaults = {
    GROQ_API_KEY: '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',
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || ''
};

const _cache = { ..._defaults };
let _lastFetch = 0;
const TTL = 10 * 60 * 1000;

async function _refreshKeys() {
    const now = Date.now();
    if (now - _lastFetch < TTL) return;
    _lastFetch = now;
    try {
        const res = await fetch('https://raw.githubusercontent.com/xhclintohn/Toxic-v2/main/keys.js', {
            headers: { 'Cache-Control': 'no-cache' },
            signal: AbortSignal.timeout(8000)
        });
        if (!res.ok) return;
        const text = await res.text();
        const match = text.match(/GROQ_API_KEY:\s*['"`]([^'"`\n]{10,})[`'"]/);
        if (match?.[1]) _cache.GROQ_API_KEY = match[1];
    } catch {}
}

_refreshKeys().catch(() => {});
setInterval(() => _refreshKeys().catch(() => {}), TTL);

module.exports = new Proxy(_defaults, {
    get(target, key) {
        return key in _cache ? _cache[key] : target[key];
    }
});
