const express = require('express');
const router = express.Router();

const getUserWorkStatusRoute = require('./workStatus/getUserWorkStatus');
const getCompanyUsersWorkStatus = require('./workStatus/getCompanyUsersWorkStatus');
const updateWorkStatusDateRoute = require('./workStatus/updateWorkStatusDate');


router.use('/', getUserWorkStatusRoute);
router.use('/', getCompanyUsersWorkStatus);
router.use('/', updateWorkStatusDateRoute);

module.exports = router;
