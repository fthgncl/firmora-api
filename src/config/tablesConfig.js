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
        // 🔑 Benzersiz işlem kimliği
        id: 'VARCHAR(36) NOT NULL UNIQUE',

        // 🏢 İşlemi kaydeden / para hareketinin bağlamı olan firma
        company_id: 'VARCHAR(36) NOT NULL',

        // 🧭 Kaynak kapsamı:
        // user    = para kullanıcının hesabından çıkar
        // company = para şirketin hesabından çıkar (operatör yine from_user_id)
        from_scope: "ENUM('user','company') NOT NULL",

        // 👤 İşlemi başlatan/operatör kullanıcı
        // incoming_manual türünde NULL olabilir (çünkü para dışarıdan geldi)
        from_user_id: 'VARCHAR(36) NULL',

        // 👥 Alıcı kullanıcı (varsa)
        // user_same_company veya user_other_company durumlarında dolu olur
        to_user_id: 'VARCHAR(36) NULL',

        // 🏢 Alıcı kullanıcının firması (sadece user_other_company için dolu)
        to_user_company_id: 'VARCHAR(36) NULL',

        // 💰 Tutar (pozitif)
        amount: 'DECIMAL(15,2) NOT NULL',

        // 💵 Para birimi (ISO-4217)
        currency: "VARCHAR(3) NOT NULL CHECK (currency REGEXP '^[A-Z]{3}$')",

        // 📝 Açıklama (örn: “Mart ayı kirası”)
        description: 'VARCHAR(255) NULL',

        // ⚙️ İşlem durumu
        status: "ENUM('pending','completed','failed','reversed') NOT NULL DEFAULT 'completed'",

        // 🔭 İşlem türü (5 senaryo)
        // - user_same_company  : Aynı firmadaki başka kullanıcıya para gönderimi
        // - user_other_company : Farklı firmadaki kullanıcıya para gönderimi
        // - external           : Sistemde hesabı olmayan kişiye ödeme
        // - expense            : Firma gideri ödemesi
        // - incoming_manual    : Sistemde olmayan birinden gelen para (manuel kayıt)
        to_kind: "ENUM('user_same_company','user_other_company','external','expense','incoming_manual') NOT NULL",

        // 🧾 External alıcı adı (SADECE to_kind='external')
        to_external_name: 'VARCHAR(120) NULL',

        // 💼 Gider adı/kategori (SADECE to_kind='expense')
        to_expense_name: 'VARCHAR(100) NULL',

        // ⏱️ Kayıt tarihi
        created_at: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',

        /*
         * 🔒 Validasyon (backend veya trigger):
         * ------------------------------------
         * amount > 0
         * currency: 3 büyük harf
         *
         * to_kind = 'user_same_company'  -> to_user_id zorunlu, to_user_company_id NULL
         * to_kind = 'user_other_company' -> to_user_id + to_user_company_id zorunlu
         * to_kind = 'external'           -> to_external_name zorunlu
         * to_kind = 'expense'            -> to_expense_name zorunlu
         * to_kind = 'incoming_manual'    -> from_user_id NULL, from_scope 'company' veya 'user' olabilir (genelde 'company')
         *
         * from_scope = 'user'    -> from_user_id ZORUNLU (kimin hesabından çıktığını bilmeliyiz)
         * from_scope = 'company' -> from_user_id ZORUNLU (işlemi kim başlattı / yetkili kim)
         *
         * Ek iş kuralı (öneri): from_scope='company' ise, from_user_id'nin company_id üzerinde
         * 'can_transfer_money' veya 'can_transfer_external' gibi yetkileri olmalı.
         */
    }

};