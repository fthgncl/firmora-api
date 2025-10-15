const tablesConfig = require('../../config/tablesConfig');
const { queryAsync } = require('../utils/connection');


// TODO: Veri tabanı yönetimini güncelleştir. Düzgün çalışmıyor !

// Sütun tipini normalleştir (boşlukları temizle, büyük harfe çevir)
const normalizeColumnType = (type) => {
    return type
        .toUpperCase()
        .replace(/\s+/g, '') // Tüm boşlukları kaldır
        .replace(/,/g, ', ') // Virgülden sonra boşluk ekle (tekrar normalleştirme için)
        .replace(/\s+/g, ''); // Tekrar tüm boşlukları kaldır
};

// MySQL tip eşdeğerliklerini kontrol et
const areTypesEquivalent = (configType, dbType) => {
    const normalizedConfig = normalizeColumnType(configType);
    const normalizedDb = normalizeColumnType(dbType);

    // Tam eşleşme varsa true döndür
    if (normalizedConfig.includes(normalizedDb) || normalizedDb.includes(normalizedConfig)) {
        return true;
    }

    // BOOLEAN -> TINYINT(1) eşdeğerliği
    if ((normalizedConfig.includes('BOOLEAN') || normalizedConfig.includes('BOOL')) 
        && normalizedDb.includes('TINYINT(1)')) {
        return true;
    }

    // INT -> INTEGER eşdeğerliği
    if ((normalizedConfig.includes('INTEGER') && normalizedDb.includes('INT'))
        || (normalizedConfig.includes('INT') && normalizedDb.includes('INTEGER'))) {
        return true;
    }

    return false;
};

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

                        // Tip eşdeğerliğini kontrol et - sadece gerçekten değişiklik gerekiyorsa güncelle
                        const needsUpdate = !areTypesEquivalent(colDef, currentType);

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

            // UNIQUE index kontrolü ve eklenmesi
            for (const [colName, colDef] of Object.entries(columns)) {
                try {
                    // Sütun tanımında UNIQUE var mı kontrol et
                    if (colDef.toUpperCase().includes('UNIQUE')) {
                        // Mevcut UNIQUE index'i kontrol et
                        const existingIndex = await queryAsync(`
                            SELECT INDEX_NAME
                            FROM INFORMATION_SCHEMA.STATISTICS
                            WHERE TABLE_NAME = '${tableName}' 
                            AND COLUMN_NAME = '${colName}' 
                            AND TABLE_SCHEMA = DATABASE()
                            AND NON_UNIQUE = 0;
                        `);

                        if (existingIndex.length === 0) {
                            // UNIQUE index yoksa ekle
                            const indexName = `uq_${tableName}_${colName}`;
                            console.log(`${tableName} tablosuna ${colName} için UNIQUE index ekleniyor...`);
                            await queryAsync(`ALTER TABLE ${tableName} ADD UNIQUE INDEX \`${indexName}\` (\`${colName}\`);`);
                            console.log(`${tableName} tablosuna ${colName} için UNIQUE index başarıyla eklendi.`);
                        }
                    }
                } catch (indexError) {
                    // Index zaten varsa veya başka bir hata oluşursa
                    if (indexError.code !== 'ER_DUP_KEYNAME') {
                        console.error(`${tableName}.${colName} için UNIQUE index eklenirken hata:`, indexError.message);
                    }
                    continue;
                }
            }
        }

        return { status: 'success', message: 'Tüm tablolar kontrol edildi ve güncellendi.' };
    } catch (error) {
        throw { status: 'error', message: 'Tablo kontrol/güncelleme sırasında bir hata oluştu.', error };
    }
};

module.exports = checkTables;