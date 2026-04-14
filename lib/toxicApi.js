const fetch = require('node-fetch');
const { TOXIC_API_KEY, TOXIC_API_FALLBACK } = require('../keys');

const BASE = 'https://api.giftedtech.co.ke/api';

function getKeys() {
    return [TOXIC_API_KEY, TOXIC_API_FALLBACK].filter(Boolean);
}

async function makeEffect(endpoint, text, extraParams = {}) {
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
    throw lastErr || new Error('Effect generation failed');
}

const _WAIFU_PICS = new Set(['waifu','neko','shinobu','megumin','bully','cuddle','cry','hug','awoo','kiss','lick','pat','smug','bonk','blush','smile','wave','highfive','handhold','nom','bite','glomp','slap','kill','happy','wink','poke','dance','cringe']);
const _NEKOS_BEST = new Set(['neko','waifu','husbando','kitsune','blush','smug','pat','hug','kiss','bite','happy','cry','dance','wave','poke','slap','cuddle','nom','punch','tickle','yeet','facepalm','bonk']);
const _ANIME_REMAP = { maid: 'waifu', miko: 'waifu', uniform: 'waifu' };

async function getAnime(endpoint) {
    const ep = _ANIME_REMAP[endpoint] || endpoint;
    const keys = getKeys();
    let lastErr;
    for (const apikey of keys) {
        try {
            const params = new URLSearchParams({ apikey });
            const res = await fetch(`${BASE}/anime/${ep}?${params}`, { timeout: 20000 });
            if (!res.ok) { lastErr = new Error(`HTTP ${res.status}`); continue; }
            const ct = res.headers.get('content-type') || '';
            if (!ct.includes('json')) { lastErr = new Error('not json'); continue; }
            const data = await res.json();
            if (!data.success) { lastErr = new Error(data.message || data.error || 'no result'); continue; }
            if (data.result) return data.result;
        } catch (e) { lastErr = e; }
    }
    if (_WAIFU_PICS.has(ep)) {
        try {
            const res = await fetch(`https://api.waifu.pics/sfw/${ep}`, { timeout: 15000 });
            if (res.ok) { const d = await res.json(); if (d.url) return d.url; }
        } catch {}
    }
    const nbEp = _NEKOS_BEST.has(ep) ? ep : 'waifu';
    try {
        const res = await fetch(`https://nekos.best/api/v2/${nbEp}`, { timeout: 15000 });
        if (res.ok) { const d = await res.json(); if (d.results?.[0]?.url) return d.results[0].url; }
    } catch {}
    throw lastErr || new Error('Anime fetch failed');
}

async function getAI(endpoint, query) {
    const keys = getKeys();
    let lastErr;
    for (const apikey of keys) {
        try {
            const params = new URLSearchParams({ q: query, apikey });
            const res = await fetch(`${BASE}/ai/${endpoint}?${params}`, { timeout: 30000 });
            if (!res.ok) { lastErr = new Error(`HTTP ${res.status}`); continue; }
            const data = await res.json();
            if (!data.success) { lastErr = new Error(data.message || data.error || 'no result'); continue; }
            return data.result;
        } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error('AI request failed');
}

async function makePhotoEdit(imageUrl, prompt, model) {
      const usedModel = model || 'nano_banana';
      const keys = getKeys();
      let lastErr;
      for (const apikey of keys) {
          try {
              const params = new URLSearchParams({ url: imageUrl, prompt, apikey, model: usedModel });
              const res = await fetch(`${BASE}/tools/photoeditorv3?${params}`, { timeout: 60000 });
              if (!res.ok) { lastErr = new Error(`HTTP ${res.status}`); continue; }
              const data = await res.json();
              if (!data.success || !data.result) { lastErr = new Error(data.message || 'no result'); continue; }
              const imgUrl = data.result?.output || data.result?.image_url || data.result?.all_outputs?.[0] || data.result;
              const imgRes = await fetch(imgUrl, { timeout: 30000 });
              if (!imgRes.ok) { lastErr = new Error(`Image fetch HTTP ${imgRes.status}`); continue; }
              return await imgRes.buffer();
          } catch (e) { lastErr = e; }
      }
      throw lastErr || new Error('Photo edit failed');
  }

  module.exports = { makeEffect, getAnime, getAI, makePhotoEdit };
