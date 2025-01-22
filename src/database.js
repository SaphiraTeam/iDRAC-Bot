const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('ipmi_config.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS ipmi_config (
        user_id TEXT PRIMARY KEY,
        ipmi_ip TEXT,
        username TEXT,
        password TEXT
    )`);
});

const Database = {
    setConfig: (userId, ipmiIp, username, password) => {
        return new Promise((resolve, reject) => {
            db.run('INSERT OR REPLACE INTO ipmi_config (user_id, ipmi_ip, username, password) VALUES (?, ?, ?, ?)',
                [userId, ipmiIp, username, password],
                (err) => err ? reject(err) : resolve());
        });
    },

    getConfig: (userId) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM ipmi_config WHERE user_id = ?', [userId],
                (err, row) => err ? reject(err) : resolve(row));
        });
    }
};

module.exports = Database;
