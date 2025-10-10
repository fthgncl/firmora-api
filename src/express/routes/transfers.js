const express = require('express');
const router = express.Router();

// Transfer route handlers
const createTransferRoute = require('./transfers/createTransfer');
// const listTransfersRoute = require('./transfers/listTransfers');
// const getTransferByIdRoute = require('./transfers/getTransferById');
// const updateTransferRoute = require('./transfers/updateTransfer');
// const deleteTransferRoute = require('./transfers/deleteTransfer');

// Transfer routes
router.use('/', createTransferRoute);
// router.use('/', listTransfersRoute);
// router.use('/', getTransferByIdRoute);
// router.use('/', updateTransferRoute);
// router.use('/', deleteTransferRoute);

module.exports = router;
