const express = require('express');
const router = express.Router();

const createAllowedDayRoute = require('./AllowedDays/createAllowedDay');
const getAllowedDaysByCompanyIdRoute = require('./AllowedDays/getAllowedDaysByCompanyId');
const getAllowedDayByIdRoute = require('./AllowedDays/getAllowedDayById');
const getAllowedDayFilesRoute = require('./AllowedDays/getAllowedDayFiles');

router.use('/', createAllowedDayRoute);
router.use('/', getAllowedDaysByCompanyIdRoute);
router.use('/', getAllowedDayByIdRoute);
router.use('/', getAllowedDayFilesRoute);

module.exports = router;
