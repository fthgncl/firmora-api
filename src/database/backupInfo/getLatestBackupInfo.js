const {queryAsync} = require("../utils/connection");

async function getLatestBackupInfo(){
    const query = 'SELECT * FROM backup_info ORDER BY created_at DESC LIMIT 1';
    const result = await queryAsync(query);
    return result[0];
}

module.exports = getLatestBackupInfo;


