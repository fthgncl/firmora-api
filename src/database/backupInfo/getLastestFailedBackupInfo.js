const {queryAsync} = require("../utils/connection");

async function getLastestFailedBackupInfo(){
    const query = 'SELECT * FROM backup_info WHERE backup_status = "failed" ORDER BY created_at DESC LIMIT 1';
    const result = await queryAsync(query);
    return result[0];
}

module.exports = getLastestFailedBackupInfo;