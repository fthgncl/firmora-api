const mysql = require('mysql');
const checkTables = require('./utils/tableManager');
const { setConnection, queryAsync } = require('./utils/connection');

async function databaseInit() {

    try {
        // Veri tabanı sunucusuna bağlan
        await connect();

        // Veri tabanını oluştur
        await createDatabase();

        // Veri tabanına bağlan
        await useDatabase();

        // Tabloları kontrol et
        await checkTables();

        return { message : 'Veri tabanı bağlantısı kuruldu.'};
    } catch (error) {
        throw error;
    }

}

function connect() {

    return new Promise((resolve, reject) => {
        const connection = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
        });


        connection.connect((error) => {
            if (error) {
                return reject({
                    status: 'error',
                    error,
                    message: 'Veri tabanı sunucusuna bağlantı başarısız.',
                });
            }

            setConnection(connection);

            resolve({
                status: 'success',
                message : 'Veri tabanı sunucusuna bağlanıldı.',
            });
        });
    });
}

async function createDatabase() {
    const dbName = process.env.DB_NAME;

    if (!dbName) {
        throw new Error('DB_NAME ortam değişkeni ayarlanmamış!');
    }

    const createDbQuery = `CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`;

    try {
        await queryAsync(createDbQuery); // Sorgu çalıştırılır
        return {
            status: 'success',
            message: `${dbName} veri tabanı oluşturuldu veya zaten mevcut.`,
        };
    } catch (error) {
        return {
            status: 'error',
            error,
            message: `Veri tabanı oluşturulurken bir hata oluştu: ${dbName}`,
        };
    }
}


function useDatabase() {
    return new Promise((resolve, reject) => {
        const dbName = process.env.DB_NAME;

        // Veri tabanına bağlan
        const useDbQuery = `USE \`${dbName}\`;`;
        queryAsync(useDbQuery, (error) => {
            if (error) {
                return reject({
                    status: 'error',
                    error,
                    message: `Veri tabanına bağlanırken bir hata oluştu: ${dbName}`,
                });
            }

            resolve({
                status: 'success',
                message : `${dbName} veri tabanına bağlanıldı.`,
            });
        });

    });
}


module.exports = {databaseInit, createDatabase, useDatabase, connect};