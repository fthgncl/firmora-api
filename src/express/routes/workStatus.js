const express = require('express');
const router = express.Router();

const getUserWorkStatusRoute = require('./workStatus/getUserWorkStatus');
const getCompanyUsersWorkStatus = require('./workStatus/getCompanyUsersWorkStatus');
const updateWorkStatusDateRoute = require('./workStatus/updateWorkStatusDate');
const getUserEntryAndExitRoute = require('./workStatus/getUserEntryAndExit');


router.use('/', getUserWorkStatusRoute);
router.use('/', getCompanyUsersWorkStatus);
router.use('/', updateWorkStatusDateRoute);
router.use('/', getUserEntryAndExitRoute);

module.exports = router;
