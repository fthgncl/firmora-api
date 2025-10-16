// src/database/utils/connection.js
const util = require('util');
const { t } = require('../../config/i18nConfig');

let connection = null;

const setConnection = (conn) => {
    if (!conn) {
        throw new Error(t('errors:database.invalidConnection'));
    }
    connection = conn;
};

const getConnection = () => {
    if (!connection) {
        throw new Error(t('errors:database.notInitialized'));
    }
    return connection;
};

const queryAsync = async (...args) => {
    if (!connection) {
        throw new Error(t('errors:database.notInitialized'));
    }

    try {
        const promisifiedQuery = util.promisify(connection.query).bind(connection);
        return await promisifiedQuery(...args);
    } catch (error) {
        error.message = `${t('errors:database.queryFailed')} - ${error.message}`;
        throw error;
    }
};

/**
 * Transaction başlatır
 * @returns {Promise<void>}
 */
const beginTransaction = async () => {
    if (!connection) {
        throw new Error(t('errors:database.notInitialized'));
    }

    try {
        await queryAsync('START TRANSACTION');
    } catch (error) {
        error.message = `${t('errors:database.transactionStartFailed')} - ${error.message}`;
        throw error;
    }
};

/**
 * Transaction'ı onaylar (commit)
 * @returns {Promise<void>}
 */
const commit = async () => {
    if (!connection) {
        throw new Error(t('errors:database.notInitialized'));
    }

    try {
        await queryAsync('COMMIT');
    } catch (error) {
        error.message = `${t('errors:database.transactionCommitFailed')} - ${error.message}`;
        throw error;
    }
};

/**
 * Transaction'ı geri alır (rollback)
 * @returns {Promise<void>}
 */
const rollback = async () => {
    if (!connection) {
        throw new Error(t('errors:database.notInitialized'));
    }

    try {
        await queryAsync('ROLLBACK');
    } catch (error) {
        error.message = `${t('errors:database.transactionRollbackFailed')} - ${error.message}`;
        throw error;
    }
};

module.exports = { setConnection, getConnection, queryAsync, beginTransaction, commit, rollback };
