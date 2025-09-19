module.exports = {
    users: {
        id: 'VARCHAR(36) NOT NULL UNIQUE',
        name: 'VARCHAR(20) NOT NULL CHECK (CHAR_LENGTH(name) >= 3)',
        surname: 'VARCHAR(20) NOT NULL CHECK (CHAR_LENGTH(surname) >= 3)',
        username: 'VARCHAR(15) NOT NULL UNIQUE CHECK (CHAR_LENGTH(username) >= 6)',
        phone: 'VARCHAR(20) UNIQUE',
        password: 'VARCHAR(255)',
        created_at: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
    }
};