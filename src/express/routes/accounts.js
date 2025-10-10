const express = require('express');
const router = express.Router();

// Account route handlers
const listAccountsRoute = require('./accounts/listAccounts');
// const getAccountByIdRoute = require('./accounts/getAccountById');
// const updateAccountRoute = require('./accounts/updateAccount');
// const deleteAccountRoute = require('./accounts/deleteAccount');

// Account routes
router.use('/', listAccountsRoute);
// router.use('/', getAccountByIdRoute);
// router.use('/', updateAccountRoute);
// router.use('/', deleteAccountRoute);

module.exports = router;
