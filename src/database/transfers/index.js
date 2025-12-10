const createTransfer = require('./createTransfer');
const listTransfers = require('./listTransfers');
const getTransferById = require('./getTransferById');
const approveTransfer = require('./approveTransfer');
const rejectTransfer = require('./rejectTransfer');

module.exports = {
    createTransfer,
    listTransfers,
    approveTransfer,
    getTransferById,
    rejectTransfer
};
