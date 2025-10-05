const express = require('express');
const router = express.Router();

// Company route handlers
const createCompanyRoute = require('./companies/createCompany');
const listCompaniesRoute = require('./companies/listCompanies');
const getCompanyByIdRoute = require('./companies/getCompanyById');
//const updateCompanyRoute = require('./companies/updateCompany');
const deleteCompanyRoute = require('./companies/deleteCompany');

// Company routes
router.use('/', createCompanyRoute);
router.use('/', listCompaniesRoute);
router.use('/', getCompanyByIdRoute);
//router.use('/', updateCompanyRoute);
router.use('/', deleteCompanyRoute);

module.exports = router;