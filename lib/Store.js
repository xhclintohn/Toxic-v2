const fs = require('fs');
const path = require('path');

// Path to store message_data as JSON
const dataDir = path.resolve(__dirname, '../data');
const storePath = path.join(dataDir, 'message_data.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(dataDir)) {
    try {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log('Toxic-MD Store: Created /app/data directory');
    } catch (e) {
        console.error('Toxic-MD Store Error: Failed to create /app/data directory:', e);
    }
}

// Initialize message_data.json if it doesn't exist
if (!fs.existsSync(storePath)) {
    try {
        fs.writeFileSync(storePath, JSON.stringify({}));
        console.log('Toxic-MD Store: Created /app/data/message_data.json');
    } catch (e) {
        console.error('Toxic-MD Store Error: Failed to create /app/data/message_data.json:', e);
    }
}

const message_data = {
    check: async ({ from }) => {
        try {
            const data = JSON.parse(fs.readFileSync(storePath, 'utf8'));
            return data[from] || null;
        } catch (e) {
            console.error('Toxic-MD Store Error: Failed to check message_data:', e);
            return null;
        }
    },
    save: async ({ from }) => {
        try {
            const data = JSON.parse(fs.readFileSync(storePath, 'utf8'));
            const msg = { id: from, created: Date.now() };
            data[from] = msg;
            fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
            return msg;
        } catch (e) {
            console.error('Toxic-MD Store Error: Failed to save message_data:', e);
            return null;
        }
    }
};

module.exports = { message_data };