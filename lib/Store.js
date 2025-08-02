const fs = require('fs');
const path = require('path');

// Path to store message_data as JSON
const storePath = path.resolve(__dirname, '../data/message_data.json');

// Initialize message_data if file doesn't exist
if (!fs.existsSync(storePath)) {
    fs.writeFileSync(storePath, JSON.stringify({}));
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