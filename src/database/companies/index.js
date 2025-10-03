const createCompany = require('./createCompany');
const getCompanyById = require('./getCompanyById');
const getCompaniesByOwnerId = require('./getCompaniesByOwnerId');
//const updateCompany = require('./updateCompany');
const deleteCompany = require('./deleteCompany');

module.exports = {
    createCompany,
    getCompanyById,
    getCompaniesByOwnerId,
    //updateCompany,
    deleteCompany
};
