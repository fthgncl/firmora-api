const express = require('express');
const router = express.Router();

const createAllowedDayRoute = require('./AllowedDays/createAllowedDay');
const getAllowedDaysByCompanyId = require('./AllowedDays/getAllowedDaysByCompanyId');
// const getAllowedDayFilesRoute = require('./AllowedDays/getAllowedDayFiles');
// const getAllowedDayByIdRoute = require('./AllowedDays/getAllowedDayById');

// AllowedDay routes
router.use('/', createAllowedDayRoute);
router.use('/', getAllowedDaysByCompanyId);
// router.use('/', getAllowedDayFilesRoute);
// router.use('/', getAllowedDayByIdRoute);

module.exports = router;
