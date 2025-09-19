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


module.exports = { setConnection, getConnection, queryAsync };