const {queryAsync} = require("../utils/connection");
const {generateUniqueId} = require("../../utils/idUtils");
const { backupFolders } = require('../../config/google.config');
const fs = require('fs').promises;
const path = require('path');

async function getDirectorySizeInMB(dirPath) {
    let totalSize = 0;

    try {
        const items = await fs.readdir(dirPath, { withFileTypes: true });

        for (const item of items) {
            const itemPath = path.join(dirPath, item.name);

            if (item.isDirectory()) {
                totalSize += await getDirectorySizeInMB(itemPath);
            } else {
                const stats = await fs.stat(itemPath);
                totalSize += stats.size;
            }
        }
    } catch (error) {
        console.error(`Klasör boyutu hesaplanamadı: ${dirPath}`, error);
    }

    return totalSize;
}

function formatBytes(bytes) {
    const tb = bytes / (1024 * 1024 * 1024 * 1024);
    const gb = bytes / (1024 * 1024 * 1024);
    const mb = bytes / (1024 * 1024);

    if (tb >= 1) {
        return `${tb.toFixed(1)} TB`;
    } else if (gb >= 1) {
        return `${gb.toFixed(1)} GB`;
    } else {
        return `${mb.toFixed(1)} MB`;
    }
}

async function getBackupFoldersTotalSize() {
    // Proje root dizini (src klasörünün bir üst dizini)
    const projectRoot = path.join(__dirname, '../../..');

    // Her klasörün boyutunu hesapla ve topla
    let totalSizeInBytes = 0;
    for (const folder of backupFolders) {
        const folderPath = path.join(projectRoot, folder);
        const sizeInBytes = await getDirectorySizeInMB(folderPath);
        totalSizeInBytes += sizeInBytes;
    }

    return formatBytes(totalSizeInBytes);
}

async function createBackupInfo(status){

    if ( !status && status === 'failed' || status === 'success'){
        throw new Error('Invalid status provided');
    }

    const id = await generateUniqueId('BI','backup_info');
    const backupSize = await getBackupFoldersTotalSize();

    const query = `INSERT INTO backup_info (id, backup_size, backup_status) VALUES ('${id}', '${backupSize}', '${status}')`;
    await queryAsync(query);


}

module.exports = createBackupInfo;