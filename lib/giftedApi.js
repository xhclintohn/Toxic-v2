const fetch = require('node-fetch');
const { GIFTED_API_KEY, GIFTED_API_KEY_FALLBACK } = require('../keys');

const BASE = 'https://api.giftedtech.co.ke/api';

function getKeys() {
    return [GIFTED_API_KEY, GIFTED_API_KEY_FALLBACK].filter(Boolean);
}

async function giftedEffect(endpoint, text, extraParams = {}) {
    const keys = getKeys();
    let lastErr;
    for (const apikey of keys) {
        try {
            const params = new URLSearchParams({ text, apikey, ...extraParams });
            const res = await fetch(`${BASE}/ephoto360/${endpoint}?${params}`, { timeout: 30000 });
            if (!res.ok) { lastErr = new Error(`HTTP ${res.status}`); continue; }
            const data = await res.json();
            if (!data.success || !data.result?.image_url) { lastErr = new Error(data.message || 'no image_url'); continue; }
            const imgRes = await fetch(data.result.image_url, { timeout: 20000 });
            if (!imgRes.ok) { lastErr = new Error(`Image fetch HTTP ${imgRes.status}`); continue; }
            return await imgRes.buffer();
        } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error('All keys failed');
}

async function giftedAnime(endpoint) {
    const keys = getKeys();
    let lastErr;
    for (const apikey of keys) {
        try {
            const params = new URLSearchParams({ apikey });
            const res = await fetch(`${BASE}/anime/${endpoint}?${params}`, { timeout: 20000 });
            if (!res.ok) { lastErr = new Error(`HTTP ${res.status}`); continue; }
            const data = await res.json();
            if (!data.success) { lastErr = new Error(data.message || data.error || 'no result'); continue; }
            return data.result;
        } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error('All keys failed');
}

module.exports = { giftedEffect, giftedAnime };
