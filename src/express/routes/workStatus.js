const express = require('express');
const router = express.Router();

const getUserWorkStatusRoute = require('./workStatus/getUserWorkStatus');
const getCompanyUsersWorkStatus = require('./workStatus/getCompanyUsersWorkStatus');

router.use('/', getUserWorkStatusRoute);
router.use('/', getCompanyUsersWorkStatus);

module.exports = router;
