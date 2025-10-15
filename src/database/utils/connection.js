const util = require('util');

let connection = null;

const setConnection = (conn) => {
    if (!conn) {
        throw new Error('Bağlantı nesnesi geçersiz!');
    }
    connection = conn;
};


const getConnection = () => {
    if (!connection) {
        throw new Error('Veritabanı bağlantısı henüz başlatılmadı!');
    }
    return connection;
};

const queryAsync = async (...args) => {
    if (!connection) {
        throw new Error('Veritabanı bağlantısı henüz başlatılmadı!');
    }

    try {
        const promisifiedQuery = util.promisify(connection.query).bind(connection);
        return await promisifiedQuery(...args);
    } catch (error) {
        error.message = `Veritabanı sorgusu başarısız - ${error.message}`;
        throw error;
    }
};

/**
 * Transaction başlatır
 * @returns {Promise<void>}
 */
const beginTransaction = async () => {
    if (!connection) {
        throw new Error('Veritabanı bağlantısı henüz başlatılmadı!');
    }

    try {
        await queryAsync('START TRANSACTION');
    } catch (error) {
        error.message = `Transaction başlatılamadı - ${error.message}`;
        throw error;
    }
};

/**
 * Transaction'ı onaylar (commit)
 * @returns {Promise<void>}
 */
const commit = async () => {
    if (!connection) {
        throw new Error('Veritabanı bağlantısı henüz başlatılmadı!');
    }

    try {
        await queryAsync('COMMIT');
    } catch (error) {
        error.message = `Transaction commit edilemedi - ${error.message}`;
        throw error;
    }
};

/**
 * Transaction'ı geri alır (rollback)
 * @returns {Promise<void>}
 */
const rollback = async () => {
    if (!connection) {
        throw new Error('Veritabanı bağlantısı henüz başlatılmadı!');
    }

    try {
        await queryAsync('ROLLBACK');
    } catch (error) {
        error.message = `Transaction rollback yapılamadı - ${error.message}`;
        throw error;
    }
};

module.exports = { setConnection, getConnection, queryAsync, beginTransaction, commit, rollback };