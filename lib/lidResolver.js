function getParticipantPhone(p) {
    const phoneNumber = p.phoneNumber || p.phone_number || p.pn || '';
    if (phoneNumber) {
        const num = String(phoneNumber).split('@')[0].split(':')[0].replace(/\D/g, '');
        if (num) return num;
    }

    const base = p.id || p.jid || '';
    if (base && !base.endsWith('@lid') && base.includes('@')) {
        const num = base.split('@')[0].split(':')[0].replace(/\D/g, '');
        if (num) return num;
    }

    const lid = p.lid || '';
    if (lid && !lid.endsWith('@lid') && lid.includes('@')) {
        const num = lid.split('@')[0].split(':')[0].replace(/\D/g, '');
        if (num) return num;
    }

    return null;
}

function getParticipantLidNum(p) {
    const base = p.id || p.jid || '';
    if (base && base.endsWith('@lid')) {
        return base.split('@')[0].split(':')[0].replace(/\D/g, '') || null;
    }

    const lid = p.lid || '';
    if (lid && lid.endsWith('@lid')) {
        return lid.split('@')[0].split(':')[0].replace(/\D/g, '') || null;
    }

    return null;
}

function resolveJidFromLid(lidJid, participants) {
    if (!lidJid) return null;
    const lidNum = lidJid.split('@')[0].split(':')[0].replace(/\D/g, '');
    if (!lidNum) return null;

    if (globalThis.lidPhoneCache) {
        const cached = globalThis.lidPhoneCache.get(lidNum);
        if (cached) return String(cached).replace(/\D/g, '') + '@s.whatsapp.net';
    }

    if (globalThis.resolvePhoneFromLid) {
        const phone = globalThis.resolvePhoneFromLid(lidJid);
        if (phone && typeof phone === 'string' && !phone.endsWith('@lid')) {
            const num = phone.split('@')[0].replace(/\D/g, '');
            if (num) return num + '@s.whatsapp.net';
        }
    }

    if (participants && participants.length > 0) {
        for (const p of participants) {
            const pLidNum = getParticipantLidNum(p);
            if (pLidNum && pLidNum === lidNum) {
                const phone = getParticipantPhone(p);
                if (phone) return phone + '@s.whatsapp.net';
            }
        }
    }

    return null;
}

function resolveTargetJid(rawJid, participants) {
    if (!rawJid) return null;
    const domain = (rawJid.split('@')[1] || '').toLowerCase();
    const num = rawJid.split('@')[0].split(':')[0].replace(/\D/g, '');
    if (!num) return null;

    if (domain === 'lid') {
        const resolved = resolveJidFromLid(rawJid, participants);
        if (resolved) return resolved;
        return null;
    }

    if (participants && participants.length > 0) {
        const match = participants.find(p => {
            const phone = getParticipantPhone(p);
            if (phone && (phone === num || phone.endsWith(num) || num.endsWith(phone))) return true;
            const base = p.id || p.jid || '';
            if (base && !base.endsWith('@lid')) {
                const pNum = base.split('@')[0].split(':')[0].replace(/\D/g, '');
                if (pNum && (pNum === num || pNum.endsWith(num) || num.endsWith(pNum))) return true;
            }
            return false;
        });
        if (match) {
            const phone = getParticipantPhone(match);
            if (phone) return phone + '@s.whatsapp.net';
        }
    }

    return num + '@s.whatsapp.net';
}

function resolvePhoneNumber(rawJid, participants) {
    if (!rawJid) return '';
    const domain = (rawJid.split('@')[1] || '').toLowerCase();
    const num = rawJid.split('@')[0].split(':')[0].replace(/\D/g, '');

    if (domain === 'lid') {
        const resolved = resolveJidFromLid(rawJid, participants);
        if (resolved) return resolved.split('@')[0].replace(/\D/g, '');
        return num;
    }

    return num;
}

export { resolveJidFromLid, resolveTargetJid, resolvePhoneNumber };
