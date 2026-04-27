const makeStore = () => {
    const contacts = {}
    const chats = Object.create(null)
    const messageMap = Object.create(null)

    const bind = (ev) => {
        ev.on('messaging-history.set', ({ contacts: newContacts }) => {
            for (const contact of (newContacts || [])) {
                contacts[contact.id] = { ...(contacts[contact.id] || {}), ...contact }
            }
        })

        ev.on('contacts.upsert', (newContacts) => {
            for (const contact of newContacts) {
                contacts[contact.id] = { ...(contacts[contact.id] || {}), ...contact }
            }
        })

        ev.on('contacts.update', (updates) => {
            for (const update of updates) {
                if (contacts[update.id]) {
                    Object.assign(contacts[update.id], update)
                } else {
                    contacts[update.id] = update
                }
            }
        })
    }

    const loadMessage = (jid, id) => {
        if (!jid || !id) return null
        const msgs = chats[jid]
        if (Array.isArray(msgs)) {
            const found = msgs.find(m => m?.key?.id === id)
            if (found) return found
        }
        const mapped = messageMap[id]
        if (mapped) {
            const mappedMsgs = chats[mapped.normalizedJid]
            if (Array.isArray(mappedMsgs)) {
                return mappedMsgs.find(m => m?.key?.id === id) || null
            }
        }
        return null
    }

    const getMessage = async (key) => {
        const msg = loadMessage(key.remoteJid, key.id)
        return msg?.message || undefined
    }

    const writeToFile = () => {}

    return {
        bind,
        contacts,
        chats,
        messageMap,
        loadMessage,
        getMessage,
        writeToFile,
    }
}

export { makeStore }
