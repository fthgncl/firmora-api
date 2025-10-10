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
        id: 'VARCHAR(36) NOT NULL UNIQUE',      // 🔑 Hesap ID (UUID)
        user_id: 'VARCHAR(36) NOT NULL',        // 👤 Kullanıcı ID (users.id)
        company_id: 'VARCHAR(36) NOT NULL',     // 🏢 Hesabın bağlı olduğu firma (companies.id)
        currency: "VARCHAR(3) NOT NULL CHECK (currency REGEXP '^[A-Z]{3}$')",   // 💵 Hesap para birimi (varsayılan: şirket para birimi)
        balance: 'DECIMAL(15,2) NOT NULL DEFAULT 0',    // 💰 Anlık bakiye (materialized). Pozitif/negatif olabilir.
        created_at: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
    },
    transfers: {
        // 🔑 Benzersiz işlem ID (UUID)
        id: 'VARCHAR(36) NOT NULL UNIQUE',

        // 🏢 İşlemi BAŞLATAN şirketin ID'si (paranın çıktığı şirket)
        company_id: 'VARCHAR(36) NOT NULL',

        // 👤 Gönderen kullanıcı (company_id içindeki user)
        from_user_id: 'VARCHAR(36) NOT NULL',

        // 🔭 Hedef türü (4 senaryo)
        // - user_same_company  : Aynı firmada başka kullanıcı
        // - user_other_company : Farklı firmada kullanıcı
        // - external           : Sistemde hesabı olmayan kişi
        // - expense            : Gider ödemesi
        to_kind: "ENUM('user_same_company','user_other_company','external','expense') NOT NULL",

        // 🎯 Hedef kullanıcı ID'si (user_same_company veya user_other_company ikisinde de kullanılır)
        to_user_id: 'VARCHAR(36) NULL',

        // 🏢 Hedef kullanıcının firması (SADECE user_other_company için zorunlu)
        to_user_company_id: 'VARCHAR(36) NULL',

        // 🧾 External alıcı adı (SADECE to_kind='external' iken zorunlu)
        to_external_name: 'VARCHAR(120) NULL',

        // 💼 Gider adı veya kategori etiketi (SADECE to_kind='expense' iken zorunlu)
        to_expense_name: 'VARCHAR(100) NULL',

        // 💰 Tutar (pozitif)
        amount: 'DECIMAL(15,2) NOT NULL',

        // 💵 Para birimi (ISO-4217 3 harf)
        currency: "VARCHAR(3) NOT NULL DEFAULT 'EUR' CHECK (currency REGEXP '^[A-Z]{3}$')",

        // 📝 Not/Açıklama
        description: 'VARCHAR(255) NULL',

        // ⚙️ Durum
        status: "ENUM('pending','completed','failed','reversed') NOT NULL DEFAULT 'completed'",

        // 🔄 Çift kayıt/entegrasyon için eşleme anahtarı (opsiyonel)
        correlation_id: 'VARCHAR(64) NULL',

        // ⏱️ Oluşturulma zamanı
        created_at: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',

        // 🔎 Önerilen indeksler (DDL tarafında ekle)
        // KEY idx_company_time (company_id, created_at DESC),
        // KEY idx_from_user (company_id, from_user_id, created_at DESC),
        // KEY idx_to_user (to_user_id, created_at DESC),
        // KEY idx_to_user_company (to_user_company_id, created_at DESC),
        // KEY idx_correlation (correlation_id)
    }
};