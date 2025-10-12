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
    },
    user_company_permissions: {
        user_id: 'VARCHAR(36) NOT NULL',
        company_id: 'VARCHAR(36) NOT NULL',
        permissions: 'VARCHAR(100) NOT NULL DEFAULT \'\' CHECK (permissions REGEXP \'^[a-zA-Z]*$\')',
        updated_at: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
        // Not: user_id + company_id için composite UNIQUE eklemek lazım
        // ALTER TABLE user_company_permissions ADD UNIQUE uq_user_company (user_id, company_id);
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
        // id : transfer no
        id: 'VARCHAR(36) NOT NULL UNIQUE',

        // user_id: işlemi kimin yaptığı (operatör)
        user_id: 'VARCHAR(36) NOT NULL',

        // company_id : hangi firma veya hangi firmanın kullanıcısı gönderecek (kaynak firma)
        company_id: 'VARCHAR(36) NOT NULL',

        // to_user_id : hangi kullanıcının hesabına gideceği (varsa)
        to_user_id: 'VARCHAR(36) NULL',

        // to_user_company_id: hangi firmaya veya hangi firmanın kullanıcısına gidecek
        // (kullanıcı hedefi: hedef kullanıcının firması | firma hedefi: doğrudan hedef firma)
        to_user_company_id: 'VARCHAR(36) NULL',

        // from_scope : para çıkışının nereden olacağı ("user" veya "company")
        from_scope: "ENUM('user','company') NOT NULL",

        // to_scope : para girişinin nereye olacağı ("user" veya "company")
        to_scope: "ENUM('user','company') NOT NULL",

        // amount: para miktarı (pozitif)
        amount: 'DECIMAL(15,2) NOT NULL',

        // currency: para birimi (ISO-4217)
        currency: "VARCHAR(3) NOT NULL CHECK (currency REGEXP '^[A-Z]{3}$')",

        // description: açıklama
        description: 'VARCHAR(255) NULL',

        // status: işlem durumu
        status: "ENUM('pending','completed','failed','reversed') NOT NULL DEFAULT 'completed'",

        // to_external_name: Sistem dışı kullanıcı için paranın gönderileceği kişi/firma adı
        // (hedef sistemde yoksa bu alanı doldur; to_user_id/to_user_company_id boş kalabilir)
        to_external_name: 'VARCHAR(120) NULL',

        // created_at: oluşturulma tarihi
        created_at: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',

        // transfer_type: transfer türü
        // - company_to_user_same      – Firma hesabından aynı firmadaki bir kullanıcıya
        // - company_to_user_other     – Firma hesabından başka firmadaki bir kullanıcıya
        // - company_to_company_other  – Firma hesabından başka bir firmaya
        // - user_to_user_same         – Kullanıcı hesabından aynı firmadaki başka bir kullanıcıya
        // - user_to_user_other        – Kullanıcı hesabından başka firmadaki bir kullanıcıya
        // - user_to_company_same      – Kullanıcı hesabından kendi firmasına
        // - user_to_company_other     – Kullanıcı hesabından başka firmaya
        transfer_type: "ENUM('company_to_user_same','company_to_user_other','company_to_company_other','user_to_user_same','user_to_user_other','user_to_company_same','user_to_company_other') NOT NULL",
    }
};