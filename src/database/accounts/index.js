const createAccount = require('./createAccount');
const getAccountsByUserId = require('./getAccountsByUserId');
const getAccountById = require('./getAccountById');
const addAccountBalance = require('./addAccountBalance');
const deductAccountBalance = require('./deductAccountBalance');

module.exports = {
    createAccount,
    getAccountsByUserId,
    addAccountBalance,
    deductAccountBalance,
    getAccountById
};
