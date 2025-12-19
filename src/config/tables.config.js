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
        max_companies: 'INT NOT NULL DEFAULT 0',
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
        auto_approve_incoming_transfers: 'TINYINT(1) NOT NULL DEFAULT 0'
    },
    user_company_permissions: {
        user_id: 'VARCHAR(36) NOT NULL',
        company_id: 'VARCHAR(36) NOT NULL',
        permissions: 'VARCHAR(100) NOT NULL DEFAULT \'\' CHECK (permissions REGEXP \'^[a-zA-Z]*$\')',
        updated_at: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
    },
    user_accounts: {
        id: 'VARCHAR(36) NOT NULL UNIQUE',
        user_id: 'VARCHAR(36) NOT NULL',
        company_id: 'VARCHAR(36) NOT NULL',
        currency: "VARCHAR(3) NOT NULL CHECK (currency REGEXP '^[A-Z]{3}$')",
        balance: 'DECIMAL(15,2) NOT NULL DEFAULT 0',
        created_at: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
    },
    transfers: {
        id: 'VARCHAR(36) NOT NULL UNIQUE',
        user_id: 'VARCHAR(36) NULL DEFAULT NULL',
        company_id: 'VARCHAR(36) NULL DEFAULT NULL',
        to_user_id: 'VARCHAR(36) NULL DEFAULT NULL',
        to_user_company_id: 'VARCHAR(36) NULL DEFAULT NULL',
        from_scope: "ENUM('user','company','external') NOT NULL",
        to_scope: "ENUM('user','company','external') NOT NULL",
        amount: 'DECIMAL(15,2) NOT NULL',
        currency: "VARCHAR(3) NOT NULL CHECK (currency REGEXP '^[A-Z]{3}$')",
        description: 'VARCHAR(255) NULL DEFAULT NULL',
        status: "ENUM('pending','completed','reject') NOT NULL",
        to_external_name: 'VARCHAR(120) NULL DEFAULT NULL',
        from_external_name: 'VARCHAR(120) NULL DEFAULT NULL',
        created_at: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
        processed_by: 'VARCHAR(36) NULL DEFAULT NULL',
        processed_at: 'DATETIME NULL DEFAULT NULL',
        sender_final_balance: 'DECIMAL(15,2) NULL DEFAULT NULL',
        receiver_final_balance: 'DECIMAL(15,2) NULL DEFAULT NULL',
        files: 'TEXT NULL DEFAULT NULL',

        // transfer_type: transfer türü
        // - company_to_user_same      – Firma hesabından aynı firmadaki bir kullanıcıya
        // - company_to_user_other     – Firma hesabından başka firmadaki bir kullanıcıya
        // - company_to_company_other  – Firma hesabından başka bir firmaya
        // - user_to_user_same         – Kullanıcı hesabından aynı firmadaki başka bir kullanıcıya
        // - user_to_user_other        – Kullanıcı hesabından başka firmadaki bir kullanıcıya
        // - user_to_company_same      – Kullanıcı hesabından kendi firmasına
        // - user_to_company_other     – Kullanıcı hesabından başka firmaya
        // - user_to_external        – Kullanıcı hesabından sistem dışı bir alıcıya (to_external_name ile)
        // - company_to_external     – Firma hesabından sistem dışı bir alıcıya (to_external_name ile)
        // - external_to_user        – Sistem dışı bir kaynaktan kullanıcı hesabına
        // - external_to_company     – Sistem dışı bir kaynaktan firma hesabına
        transfer_type: "ENUM('company_to_user_same','company_to_user_other','company_to_company_other','user_to_user_same','user_to_user_other','user_to_company_same','user_to_company_other','user_to_external','company_to_external','external_to_user','external_to_company') NOT NULL",
    },
    user_company_entries: {
        id: 'VARCHAR(36) NOT NULL UNIQUE',
        user_id: 'VARCHAR(36) NOT NULL',
        company_id: 'VARCHAR(36) NOT NULL',
        entry_type: "ENUM('entry','exit') NOT NULL",
        note: 'VARCHAR(255) NULL DEFAULT NULL',
        created_at: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'
    }
};