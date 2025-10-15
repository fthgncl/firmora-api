const express = require('express');
const router = express.Router();

// Company route handlers
const createCompanyRoute = require('./companies/createCompany');
const listCompaniesRoute = require('./companies/listCompanies');
const getCompanyByIdRoute = require('./companies/getCompanyById');
const addUserToCompanyRoute = require('./companies/addUserToCompany');
const searchCompaniesRoute = require('./companies/searchCompanies');
//const updateCompanyRoute = require('./companies/updateCompany');
const deleteCompanyRoute = require('./companies/deleteCompany');


// Company routes
router.use('/', createCompanyRoute);
router.use('/', listCompaniesRoute);
router.use('/', getCompanyByIdRoute);
router.use('/', addUserToCompanyRoute);
router.use('/search', searchCompaniesRoute);
//router.use('/', updateCompanyRoute);
router.use('/', deleteCompanyRoute);

module.exports = router;