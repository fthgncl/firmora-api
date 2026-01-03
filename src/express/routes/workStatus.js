const express = require('express');
const router = express.Router();

// Mevcut route'ları içe aktarma
const getUserWorkStatusRoute = require('./workStatus/getUserWorkStatus');
// const getWorkReportRoute = require('./workStatus/getWorkReport');
// const listAllUsersWorkStatusRoute = require('./workStatus/listAllUsersWorkStatus');

// Route'ları tanımla
router.use('/', getUserWorkStatusRoute);
// router.use('/work-report', getWorkReportRoute);
// router.use('/list-all-users', listAllUsersWorkStatusRoute);

module.exports = router;
