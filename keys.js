const _raw = [
    process.env.GROQ_KEY_1 || process.env.GROQ_API_KEY || '',
    process.env.GROQ_KEY_2 || '',
    process.env.GROQ_KEY_3 || '',
    process.env.GROQ_KEY_4 || '',
    process.env.GROQ_KEY_5 || '',
];

export const GROQ_API_KEYS = _raw.filter(k => k && k.length > 10 && k !== 'APIky');

export const GROQ_API_KEY = GROQ_API_KEYS[0] || '';

let _keyIdx = 0;

export function getNextGroqKey() {
    if (GROQ_API_KEYS.length === 0) return '';
    const key = GROQ_API_KEYS[_keyIdx % GROQ_API_KEYS.length];
    _keyIdx = (_keyIdx + 1) % GROQ_API_KEYS.length;
    return key;
}

export function markKeyFailed(key) {
    const idx = GROQ_API_KEYS.indexOf(key);
    if (idx !== -1 && GROQ_API_KEYS.length > 1) {
        _keyIdx = (idx + 1) % GROQ_API_KEYS.length;
    }
}

export const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
export const TOXIC_API_KEY = process.env.TOXIC_API_KEY || 'xxx';
export const TOXIC_API_FALLBACK = process.env.TOXIC_API_FALLBACK || 'xxx';
