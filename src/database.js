const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('ipmi_config.db');

db.on('error', (err) => {
    console.error('Database error:', err);
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS ipmi_servers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        server_name TEXT,
        ipmi_ip TEXT,
        username TEXT,
        password TEXT,
        UNIQUE(user_id, server_name)
    )`, (err) => {
        if (err) {
            console.error('Error creating table:', err);
        } else {
            console.log('Database table ready');
        }
    });
});

const Database = {
    setConfig: (userId, serverName, ipmiIp, username, password) => {
        return new Promise((resolve, reject) => {
            db.run('INSERT OR REPLACE INTO ipmi_servers (user_id, server_name, ipmi_ip, username, password) VALUES (?, ?, ?, ?, ?)',
                [userId, serverName, ipmiIp, username, password],
                (err) => err ? reject(err) : resolve());
        });
    },

    getConfig: (userId, serverName) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM ipmi_servers WHERE user_id = ? AND server_name = ?', 
                [userId, serverName],
                (err, row) => err ? reject(err) : resolve(row));
        });
    },

    listServers: (userId) => {
        return new Promise((resolve, reject) => {
            console.log('Querying servers for user:', userId);
            const query = 'SELECT server_name, ipmi_ip FROM ipmi_servers WHERE user_id = ?';
            db.all(query, [userId], (err, rows) => {
                if (err) {
                    console.error('Database query error:', err);
                    reject(err);
                    return;
                }
                console.log('Query results:', rows);
                resolve(rows || []);
            });
        });
    },

    getDefaultServer: (userId) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM ipmi_servers WHERE user_id = ? ORDER BY id ASC LIMIT 1', 
                [userId],
                (err, row) => err ? reject(err) : resolve(row));
        });
    }
};

module.exports = Database;
