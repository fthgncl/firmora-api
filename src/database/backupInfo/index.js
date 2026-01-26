const createBackupInfo = require('./createBackupInfo');
const getLatestBackupInfo = require('./getLatestBackupInfo');
const getLastestFailedBackupInfo = require('./getLastestFailedBackupInfo');
const getLastestSuccessfulBackupInfo = require('./getLastestSuccessfulBackupInfo');


module.exports = {
    createBackupInfo,
    getLatestBackupInfo,
    getLastestFailedBackupInfo,
    getLastestSuccessfulBackupInfo
};
