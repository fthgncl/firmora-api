const tablesConfig = require('../../config/tablesConfig');
const { queryAsync } = require('../utils/connection');

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
                const existingCol = await queryAsync(`
                    SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY, EXTRA
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = '${tableName}' AND COLUMN_NAME = '${colName}';
                `);

                if (existingCol.length === 0) {
                    // Sütun yoksa ekle
                    await queryAsync(`ALTER TABLE ${tableName} ADD COLUMN \`${colName}\` ${colDef};`);
                } else {
                    // Sütun mevcut ama farklıysa güncelle
                    const currentType = `${existingCol[0].COLUMN_TYPE} ${existingCol[0].IS_NULLABLE === 'NO' ? 'NOT NULL' : ''}`;
                    if (currentType !== colDef) {
                        await queryAsync(`ALTER TABLE ${tableName} MODIFY COLUMN \`${colName}\` ${colDef};`);
                    }
                }
            }
        }

        return { status: 'success', message: 'Tüm tablolar kontrol edildi ve güncellendi.' };
    } catch (error) {
        throw { status: 'error', message: 'Tablo kontrol/güncelleme sırasında bir hata oluştu.', error };
    }
};

module.exports = checkTables;