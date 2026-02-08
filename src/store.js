const { initAuthCreds, BufferJSON, proto } = require("@whiskeysockets/baileys")
const pino = require('pino')

const makeInMemoryStore = (logger) => {
    logger = logger || pino().child({ level: 'fatal' })
    const creds = initAuthCreds()
    const keys = {}
    const store = {
        chats: {},
        contacts: {},
        messages: {},
        groupMetadata: {},
        presences: {},
        state: {
            creds,
            keys: {
                get: (type, ids) => {
                    const key = JSON.stringify({ type, ids: ids.sort() })
                    return keys[key] || null
                },
                set: (data) => {
                    const key = JSON.stringify({ type: data.type, ids: data.ids.sort() })
                    keys[key] = data
                }
            }
        },
        loadMessage: async (jid, id) => {
            let message = store.messages[jid]?.[id]
            return message ? proto.WebMessageInfo.fromObject(message) : undefined
        },
        loadMessages: async (jid, limit) => {
            const messages = Object.values(store.messages[jid] || {})
                .sort((a, b) => (b.messageTimestamp || 0) - (a.messageTimestamp || 0))
                .slice(0, limit)
                .map(m => proto.WebMessageInfo.fromObject(m))
            return messages
        },
        loadMessagesWithCursor: async (jid, cursor, limit) => {
            const messages = Object.values(store.messages[jid] || {})
                .sort((a, b) => (b.messageTimestamp || 0) - (a.messageTimestamp || 0))
            const start = cursor ? messages.findIndex(m => m.key.id === cursor) + 1 : 0
            return {
                messages: messages.slice(start, start + limit).map(m => proto.WebMessageInfo.fromObject(m)),
                cursor: messages[start + limit]?.key.id
            }
        },
        mostRecentMessage: async (jid) => {
            const messages = Object.values(store.messages[jid] || {})
            const message = messages.sort((a, b) => (b.messageTimestamp || 0) - (a.messageTimestamp || 0))[0]
            return message ? proto.WebMessageInfo.fromObject(message) : null
        },
        fetchImageUrl: async (jid, sock) => {
            const contact = store.contacts[jid]
            if (!contact) return null
            if (typeof sock === 'object' && sock.profilePictureUrl) {
                return await sock.profilePictureUrl(jid)
            }
            return null
        },
        fetchGroupMetadata: async (jid, sock) => {
            if (!store.groupMetadata[jid]) {
                if (typeof sock === 'object' && sock.groupMetadata) {
                    const metadata = await sock.groupMetadata(jid)
                    store.groupMetadata[jid] = metadata
                }
            }
            return store.groupMetadata[jid]
        },
        fetchBroadcastListInfo: async (jid, sock) => {
            return {}
        },
        fetchMessageReceipts: async ({ remoteJid, id }) => {
            return []
        },
        toJSON: () => ({
            chats: store.chats,
            contacts: store.contacts,
            messages: store.messages,
            groupMetadata: store.groupMetadata,
            presences: store.presences
        }),
        fromJSON: (json) => {
            Object.assign(store.chats, json.chats || {})
            Object.assign(store.contacts, json.contacts || {})
            Object.assign(store.messages, json.messages || {})
            Object.assign(store.groupMetadata, json.groupMetadata || {})
            Object.assign(store.presences, json.presences || {})
        },
        writeToFile: (path) => {
            const fs = require('fs')
            fs.writeFileSync(path, JSON.stringify(store.toJSON(), null, 2))
        },
        readFromFile: (path) => {
            const fs = require('fs')
            if (fs.existsSync(path)) {
                const json = JSON.parse(fs.readFileSync(path, 'utf-8'))
                store.fromJSON(json)
            }
        },
        bind: (ev) => {
            ev.on('connection.update', (update) => {
                const { connection, lastDisconnect } = update
                if (connection === 'open') {
                    logger.info('connected to store')
                } else if (connection === 'close') {
                    logger.warn('connection closed')
                }
            })
            ev.on('creds.update', (credsUpdate) => {
                Object.assign(creds, credsUpdate)
            })
            ev.on('chats.set', ({ chats: newChats }) => {
                store.chats = newChats.reduce((acc, chat) => {
                    acc[chat.id] = chat
                    return acc
                }, {})
            })
            ev.on('contacts.set', ({ contacts }) => {
                store.contacts = contacts.reduce((acc, contact) => {
                    acc[contact.id] = contact
                    return acc
                }, {})
            })
            ev.on('messages.set', ({ messages: newMessages }) => {
                store.messages = newMessages.reduce((acc, msg) => {
                    const jid = msg.key.remoteJid
                    if (!acc[jid]) acc[jid] = {}
                    acc[jid][msg.key.id] = msg
                    return acc
                }, {})
            })
            ev.on('messages.upsert', ({ messages: newMessages, type }) => {
                newMessages.forEach((msg) => {
                    const jid = msg.key.remoteJid
                    if (!store.messages[jid]) store.messages[jid] = {}
                    store.messages[jid][msg.key.id] = msg
                })
            })
            ev.on('messages.update', (updates) => {
                updates.forEach((update) => {
                    const jid = update.key.remoteJid
                    if (store.messages[jid] && store.messages[jid][update.key.id]) {
                        Object.assign(store.messages[jid][update.key.id], update.update)
                    }
                })
            })
            ev.on('messages.delete', (deletions) => {
                if (deletions.keys) {
                    deletions.keys.forEach((key) => {
                        const jid = key.remoteJid
                        if (store.messages[jid]) {
                            delete store.messages[jid][key.id]
                        }
                    })
                } else if (deletions.jid) {
                    delete store.messages[deletions.jid]
                }
            })
            ev.on('groups.set', ({ groups }) => {
                store.groupMetadata = groups.reduce((acc, group) => {
                    acc[group.id] = group
                    return acc
                }, {})
            })
            ev.on('groups.update', (updates) => {
                updates.forEach((update) => {
                    const id = update.id
                    if (store.groupMetadata[id]) {
                        Object.assign(store.groupMetadata[id], update)
                    } else {
                        store.groupMetadata[id] = update
                    }
                })
            })
            ev.on('group-participants.update', ({ id, participants, action }) => {
                if (!store.groupMetadata[id]) store.groupMetadata[id] = { id, participants: [] }
                switch (action) {
                    case 'add':
                        participants.forEach((participant) => {
                            if (!store.groupMetadata[id].participants.some(p => p.id === participant)) {
                                store.groupMetadata[id].participants.push({ id: participant, admin: null })
                            }
                        })
                        break
                    case 'remove':
                        store.groupMetadata[id].participants = store.groupMetadata[id].participants.filter(p => !participants.includes(p.id))
                        break
                    case 'promote':
                    case 'demote':
                        store.groupMetadata[id].participants.forEach((participant) => {
                            if (participants.includes(participant.id)) {
                                participant.admin = action === 'promote' ? 'admin' : null
                            }
                        })
                        break
                }
            })
            ev.on('presence.update', ({ id, presences }) => {
                store.presences[id] = presences
            })
            ev.on('chats.update', (updates) => {
                updates.forEach((update) => {
                    const id = update.id
                    if (store.chats[id]) {
                        Object.assign(store.chats[id], update)
                    }
                })
            })
            ev.on('contacts.update', (updates) => {
                updates.forEach((update) => {
                    const id = update.id
                    if (store.contacts[id]) {
                        Object.assign(store.contacts[id], update)
                    }
                })
            })
            ev.on('message-receipt.update', (updates) => {
                updates.forEach(({ key, receipt }) => {
                    const jid = key.remoteJid
                    const id = key.id
                    if (store.messages[jid] && store.messages[jid][id]) {
                        const msg = store.messages[jid][id]
                        if (!msg.userReceipt) msg.userReceipt = []
                        const recp = msg.userReceipt.find(r => r.userJid === receipt.userJid)
                        if (recp) Object.assign(recp, receipt)
                        else msg.userReceipt.push(receipt)
                    }
                })
            })
        }
    }
    store.loadMessage = store.loadMessage.bind(store)
    store.loadMessages = store.loadMessages.bind(store)
    store.loadMessagesWithCursor = store.loadMessagesWithCursor.bind(store)
    store.mostRecentMessage = store.mostRecentMessage.bind(store)
    store.fetchImageUrl = store.fetchImageUrl.bind(store)
    store.fetchGroupMetadata = store.fetchGroupMetadata.bind(store)
    store.fetchBroadcastListInfo = store.fetchBroadcastListInfo.bind(store)
    store.fetchMessageReceipts = store.fetchMessageReceipts.bind(store)
    store.toJSON = store.toJSON.bind(store)
    store.fromJSON = store.fromJSON.bind(store)
    store.writeToFile = store.writeToFile.bind(store)
    store.readFromFile = store.readFromFile.bind(store)
    store.bind = store.bind.bind(store)
    return store
}

module.exports = { makeInMemoryStore }