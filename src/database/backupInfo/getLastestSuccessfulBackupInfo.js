const {queryAsync} = require("../utils/connection");

async function getLastestSuccessfulBackupInfo(){
    const query = 'SELECT * FROM backup_info WHERE backup_status = "success" ORDER BY created_at DESC LIMIT 1';
    const result = await queryAsync(query);
    return result[0];
}

module.exports = getLastestSuccessfulBackupInfo;