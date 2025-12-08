const createTransfer = require('./createTransfer');
const listTransfers = require('./listTransfers');
const getTransferById = require('./getTransferById');
const approveTransfer = require('./approveTransfer');

module.exports = {
    createTransfer,
    listTransfers,
    approveTransfer,
    getTransferById
};
