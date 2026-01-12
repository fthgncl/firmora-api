const express = require('express');
const router = express.Router();

const createAllowedDayRoute = require('./AllowedDays/createAllowedDay');
const getAllowedDaysByCompanyIdRoute = require('./AllowedDays/getAllowedDaysByCompanyId');
const getAllowedDayByIdRoute = require('./AllowedDays/getAllowedDayById');
// const getAllowedDayFilesRoute = require('./AllowedDays/getAllowedDayFiles');
// const getAllowedDayByIdRoute = require('./AllowedDays/getAllowedDayById');

// AllowedDay routes
router.use('/', createAllowedDayRoute);
router.use('/', getAllowedDaysByCompanyIdRoute);
router.use('/', getAllowedDayByIdRoute);

module.exports = router;
