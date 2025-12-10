const express = require('express');
const router = express.Router();

// Transfer route handlers
const createTransferRoute = require('./transfers/createTransfer');
const listTransfersRoute = require('./transfers/listTransfers');
const getTransferFilesRoute = require('./transfers/getTransferFiles');
const getTransferByIdRoute = require('./transfers/getTransferById');
const approveTransferRoute = require('./transfers/approveTransfer');
const getPendingTransfers = require('./transfers/getPendingTransfers');
const rejectTransferRoute = require('./transfers/rejectTransfer');

// Transfer routes
router.use('/', createTransferRoute);
router.use('/', listTransfersRoute);
router.use('/', getTransferFilesRoute);
router.use('/', getTransferByIdRoute);
router.use('/', approveTransferRoute);
router.use('/', getPendingTransfers);
router.use('/', rejectTransferRoute);

module.exports = router;
