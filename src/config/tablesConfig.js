module.exports = {
    users: {
        id: 'VARCHAR(36) NOT NULL UNIQUE',
        name: 'VARCHAR(20) NOT NULL CHECK (CHAR_LENGTH(name) >= 3)',
        surname: 'VARCHAR(20) NOT NULL CHECK (CHAR_LENGTH(surname) >= 3)',
        username: 'VARCHAR(15) NOT NULL UNIQUE CHECK (CHAR_LENGTH(username) >= 6)',
        email: 'VARCHAR(50) NOT NULL UNIQUE',
        emailverified: 'BOOLEAN NOT NULL DEFAULT FALSE',
        phone: 'VARCHAR(20) NOT NULL UNIQUE',
        password: 'VARCHAR(255)',
        created_at: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'
    },
    companies: {
        id: 'VARCHAR(36) NOT NULL UNIQUE',
        company_name: 'VARCHAR(50) NOT NULL UNIQUE CHECK (CHAR_LENGTH(company_name) >= 2)',
        sector: 'VARCHAR(50) NULL',
        currency: 'VARCHAR(3) NOT NULL DEFAULT \'EUR\' CHECK (currency REGEXP \'^[A-Z]{3}$\')',
        balance: 'DECIMAL(15, 2) NOT NULL DEFAULT 0',
        owner_id: 'VARCHAR(36) NOT NULL',
        created_at: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
    },
    user_company_permissions: {
        user_id: 'VARCHAR(36) NOT NULL',
        company_id: 'VARCHAR(36) NOT NULL',
        permissions: 'VARCHAR(100) NOT NULL DEFAULT \'\' CHECK (permissions REGEXP \'^[a-zA-Z]*$\')',
        updated_at: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
        // Not: user_id + company_id için composite UNIQUE eklemek lazım
        // ALTER TABLE user_company_permissions ADD UNIQUE uq_user_company (user_id, company_id);
    }
};