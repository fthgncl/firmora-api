const createCompany = require('./createCompany');
const getCompanyById = require('./getCompanyById');
const getCompaniesByOwnerId = require('./getCompaniesByOwnerId');
const getEmployeesByCompanyId = require('./getEmployeesByCompanyId');
const searchCompanies = require('./searchCompanies');
//const updateCompany = require('./updateCompany');
const deleteCompany = require('./deleteCompany');
const addCompanyBalance = require('./addCompanyBalance');
const deductCompanyBalance = require('./deductCompanyBalance');

module.exports = {
    createCompany,
    getCompanyById,
    getCompaniesByOwnerId,
    getEmployeesByCompanyId,
    searchCompanies,
    //updateCompany,
    deleteCompany,
    addCompanyBalance,
    deductCompanyBalance
};
