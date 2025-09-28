const tablesConfig = require('../../config/tablesConfig');
const { queryAsync } = require('../utils/connection');
const createUser = require('../users/createUser');

const checkTables = async () => {

    try {
        // tablesConfig'de olmayan boş tabloları sil
        const allTables = await queryAsync(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE';
        `);

        const configTableNames = Object.keys(tablesConfig);

        for (const table of allTables) {
            const tableName = table.TABLE_NAME;

            // tablesConfig'de olmayan tablolar
            if (!configTableNames.includes(tableName)) {
                // Tablo boş mu kontrol et
                const rowCount = await queryAsync(`SELECT COUNT(*) as count FROM \`${tableName}\``);

                if (rowCount[0].count === 0) {
                    // Boş tabloyu sil
                    await queryAsync(`DROP TABLE \`${tableName}\``);
                }
            }
        }

        for (const [tableName, columns] of Object.entries(tablesConfig)) {
            // Tabloyu oluştur (varsa mevcut tabloyu değiştirmez)
            const createTableSQL = `
                CREATE TABLE IF NOT EXISTS ${tableName} (${Object.entries(columns).map(([colName, colDef]) => `\`${colName}\` ${colDef}`).join(', ')});
            `;
            await queryAsync(createTableSQL);

            // Kısıtlamaları al
            const existingConstraints = await queryAsync(`
                SELECT CONSTRAINT_NAME
                FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                WHERE TABLE_NAME = '${tableName}' AND TABLE_SCHEMA = DATABASE();
            `);

            const existingConstraintNames = existingConstraints.map(c => c.CONSTRAINT_NAME);

            // Fazlalık olan kısıtlamaları kaldır
            for (const constraintName of existingConstraintNames) {
                const isStillNeeded = Object.entries(columns).some(([colName, colDef]) => colDef.includes(constraintName));

                if (!isStillNeeded) {
                    try {
                        await queryAsync(`ALTER TABLE ${tableName} DROP CONSTRAINT \`${constraintName}\`;`);
                    } catch (error) {
                        if (error.code !== 'ER_NONEXISTING_CONSTRAINT') {
                            throw error;
                        }
                    }
                }
            }

            // Sütun kontrolü ve güncellemesi
            for (const [colName, colDef] of Object.entries(columns)) {
                try {
                    const existingCol = await queryAsync(`
                        SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY, EXTRA
                        FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_NAME = '${tableName}' AND COLUMN_NAME = '${colName}' AND TABLE_SCHEMA = DATABASE();
                    `);

                    if (existingCol.length === 0) {
                        // Sütun yoksa ekle
                        console.log(`${tableName} tablosuna ${colName} sütunu ekleniyor...`);
                        await queryAsync(`ALTER TABLE ${tableName} ADD COLUMN \`${colName}\` ${colDef};`);
                        console.log(`${tableName} tablosuna ${colName} sütunu başarıyla eklendi.`);
                    } else {
                        // Sütun mevcut, tip kontrolü yap
                        const currentCol = existingCol[0];
                        const currentType = currentCol.COLUMN_TYPE;
                        const isNullable = currentCol.IS_NULLABLE === 'YES';
                        const hasDefault = currentCol.COLUMN_DEFAULT !== null;

                        // Basit tip karşılaştırması - sadece değişiklik gerekiyorsa güncelle
                        const needsUpdate = !colDef.toUpperCase().includes(currentType.toUpperCase());

                        if (needsUpdate) {
                            console.log(`${tableName} tablosundaki ${colName} sütunu güncelleniyor...`);
                            await queryAsync(`ALTER TABLE ${tableName} MODIFY COLUMN \`${colName}\` ${colDef};`);
                            console.log(`${tableName} tablosundaki ${colName} sütunu başarıyla güncellendi.`);
                        }
                    }
                } catch (columnError) {
                    console.error(`${tableName}.${colName} sütunu işlenirken hata:`, columnError.message);
                    // Sütun hatası durumunda diğer sütunları işlemeye devam et
                    continue;
                }
            }
        }

        // Admin kullanıcı kontrolü - "a" yetkisine sahip kullanıcı var mı?
        try {
            const adminUsers = await queryAsync(`
                SELECT COUNT(*) as count 
                FROM users 
                WHERE permissions LIKE '%a%';
            `);
    
            if (adminUsers[0].count === 0) {
                // "a" yetkisine sahip kullanıcı yoksa admin kullanıcı oluştur
                console.log('Admin yetkisine sahip kullanıcı bulunamadı, varsayılan admin kullanıcı oluşturuluyor...');

                const adminUserData = {
                    name: 'Admin',
                    surname: 'User',
                    username: 'admin',
                    phone: '905551112233',
                    password: 'admin',
                    permissions: 'a'
                };

                await createUser(adminUserData);
                console.log(`Varsayılan admin kullanıcı başarıyla oluşturuldu (username: ${adminUserData.username}, password: ${adminUserData.password})`);
            }
        } catch (adminError) {
            console.error('Admin kullanıcı kontrolü/oluşturma sırasında hata:', adminError);
            // Admin kullanıcı hatası tablo kontrollerini durdurmasın
        }

        return { status: 'success', message: 'Tüm tablolar kontrol edildi ve güncellendi.' };
    } catch (error) {
        throw { status: 'error', message: 'Tablo kontrol/güncelleme sırasında bir hata oluştu.', error };
    }
};

module.exports = checkTables;