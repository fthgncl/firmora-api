module.exports = {
    users: {
        id: 'VARCHAR(36) NOT NULL UNIQUE',
        name: 'VARCHAR(20) NOT NULL CHECK (CHAR_LENGTH(name) >= 3)',
        surname: 'VARCHAR(20) NOT NULL CHECK (CHAR_LENGTH(surname) >= 3)',
        username: 'VARCHAR(15) NOT NULL UNIQUE CHECK (CHAR_LENGTH(username) >= 6)',
        phone: 'VARCHAR(20) NOT NULL UNIQUE',
        password: 'VARCHAR(255)',
        created_at: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
        permissions: 'VARCHAR(50) NOT NULL DEFAULT \'\' CHECK (permissions REGEXP \'^[a-zA-Z]*$\')',
    },
    companies: {
        id: 'VARCHAR(36) NOT NULL UNIQUE',
        company_name: 'VARCHAR(50) NOT NULL UNIQUE CHECK (CHAR_LENGTH(company_name) >= 2)',
        sector: 'VARCHAR(50) NULL',
        currency: 'VARCHAR(3) NOT NULL DEFAULT \'USD\' CHECK (currency REGEXP \'^[A-Z]{3}$\')',
        owner_id: 'VARCHAR(36) NOT NULL',
        created_at: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
    }
};