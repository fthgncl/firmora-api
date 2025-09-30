const express = require('express');
const router = express.Router();

// Company route handlers
const createCompanyRoute = require('./companies/createCompany');
const listCompaniesRoute = require('./companies/listCompanies');
const updateCompanyRoute = require('./companies/updateCompany');
const deleteCompanyRoute = require('./companies/deleteCompany');

// Company routes
router.use('/', createCompanyRoute);

module.exports = router;