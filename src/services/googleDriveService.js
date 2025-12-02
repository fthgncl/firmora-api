// src/services/googleDriveService.js
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types'); // npm install mime-types
const googleConfig = require('../config/google.config');

let driveClient = null;

/**
 * Google Drive client'ı tekil (singleton) olacak şekilde döndürür
 */
function getDriveClient() {
    if (driveClient) return driveClient;

    const oAuth2Client = new google.auth.OAuth2(
        googleConfig.credentials.clientId,
        googleConfig.credentials.clientSecret,
        googleConfig.credentials.redirectUri
    );

    oAuth2Client.setCredentials({
        access_token: googleConfig.tokens.accessToken,
        refresh_token: googleConfig.tokens.refreshToken,
        scope: googleConfig.tokens.scope,
        token_type: googleConfig.tokens.tokenType,
        expiry_date: googleConfig.tokens.expiryDate
    });

    driveClient = google.drive({ version: 'v3', auth: oAuth2Client });
    return driveClient;
}

/**
 * Belirli bir parent altında isimle klasör arar, bulamazsa oluşturur.
 * @param {object} drive
 * @param {string} name - Klasör adı
 * @param {string|null} parentId - Parent klasör ID'si (root için null)
 * @returns {Promise<string>} - Klasör ID
 */
async function findOrCreateFolder(drive, name, parentId = null) {
    const parentClause = parentId
        ? `'${parentId}' in parents`
        : `'root' in parents`;

    const q = [
        `name = '${name.replace(/'/g, "\\'")}'`,
        `mimeType = 'application/vnd.google-apps.folder'`,
        parentClause,
        'trashed = false'
    ].join(' and ');

    const res = await drive.files.list({
        q,
        fields: 'files(id, name)',
        spaces: 'drive'
    });

    if (res.data.files && res.data.files.length > 0) {
        return res.data.files[0].id;
    }

    // Yoksa oluştur
    const fileMetadata = {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : undefined
    };

    const createRes = await drive.files.create({
        resource: fileMetadata,
        fields: 'id'
    });

    return createRes.data.id;
}

/**
 * Bir parent klasör altındaki tüm child dosya/klasörleri map olarak döndürür.
 * Key: name, Value: { id, mimeType }
 */
async function getChildrenMap(drive, parentId) {
    const children = {};
    let pageToken = null;

    do {
        const res = await drive.files.list({
            q: `'${parentId}' in parents and trashed = false`,
            fields: 'nextPageToken, files(id, name, mimeType)',
            spaces: 'drive',
            pageToken
        });

        (res.data.files || []).forEach(file => {
            children[file.name] = {
                id: file.id,
                mimeType: file.mimeType
            };
        });

        pageToken = res.data.nextPageToken;
    } while (pageToken);

    return children;
}

/**
 * Tek bir dosyayı, parent klasör altına eğer yoksa yükler.
 */
async function uploadFileIfNotExists(drive, parentId, fileName, filePath, existingChildrenMap) {
    if (existingChildrenMap[fileName]) {
        // Zaten var, geç
        return existingChildrenMap[fileName].id;
    }

    const mimeType = mime.lookup(fileName) || 'application/octet-stream';

    const fileMetadata = {
        name: fileName,
        parents: [parentId]
    };

    const media = {
        mimeType,
        body: fs.createReadStream(filePath)
    };

    const res = await drive.files.create({
        resource: fileMetadata,
        media,
        fields: 'id'
    });

    return res.data.id;
}

/**
 * Local klasörü (alt klasörler dahil) Drive'daki bir klasörle eşitler.
 * Yalnızca var olmayan klasör/dosya oluşturulur (silme/güncelleme yok).
 *
 * @param {object} drive
 * @param {string} localFolderPath - Local tam path
 * @param {string} driveFolderId - Drive klasör ID
 */
async function syncLocalFolderToDrive(drive, localFolderPath, driveFolderId) {
    if (!fs.existsSync(localFolderPath)) {
        console.warn(`[GoogleDriveBackup] Local folder not found, skipping: ${localFolderPath}`);
        return;
    }

    const stats = fs.statSync(localFolderPath);
    if (!stats.isDirectory()) {
        console.warn(`[GoogleDriveBackup] Not a directory, skipping: ${localFolderPath}`);
        return;
    }

    // Bu Drive klasörü altındaki mevcut dosya/klasörleri tek seferde çek
    const childrenMap = await getChildrenMap(drive, driveFolderId);

    const entries = fs.readdirSync(localFolderPath, { withFileTypes: true });

    for (const entry of entries) {
        const entryName = entry.name;
        const fullPath = path.join(localFolderPath, entryName);

        if (entry.isDirectory()) {
            // Alt klasör -> Drive’da var mı?
            let subFolderId;
            if (childrenMap[entryName] &&
                childrenMap[entryName].mimeType === 'application/vnd.google-apps.folder') {
                subFolderId = childrenMap[entryName].id;
            } else {
                subFolderId = await findOrCreateFolder(drive, entryName, driveFolderId);
            }

            // Recursively alt klasörü de senkronize et
            await syncLocalFolderToDrive(drive, fullPath, subFolderId);
        } else if (entry.isFile()) {
            // Dosya -> Drive’da yoksa yükle
            await uploadFileIfNotExists(
                drive,
                driveFolderId,
                entryName,
                fullPath,
                childrenMap
            );
        } else {
            // Symbolic link, soket vs. görmezden gel
            console.warn(`[GoogleDriveBackup] Skipping non-regular entry: ${fullPath}`);
        }
    }
}

/**
 * Root backup klasörünü (örn: "Firmora Backups") Drive'da garanti eder.
 * @returns {Promise<string>} rootFolderId
 */
async function ensureRootBackupFolder() {
    const drive = getDriveClient();
    const env = process.env.NODE_ENV || 'development';

    let rootFolderName = googleConfig.drive.rootFolderName;

    if (env !== 'production') {
        rootFolderName = `${rootFolderName} (${env})`;
    }

    return await findOrCreateFolder(drive, rootFolderName, null);
}

/**
 * Google Drive ile backupFolders içeriğini senkronize eder.
 * 1) Root backup klasörü kontrol/oluştur
 * 2) Her backupFolders klasörünü root altında oluştur/kontrol
 * 3) Local klasörü içerikleriyle Drive'a "yoksa yükle" mantığıyla senkronize et
 */
async function syncBackupFolders() {
    try {
        const drive = getDriveClient();

        console.log('[GoogleDriveBackup] Starting backup sync...');

        const rootFolderId = await ensureRootBackupFolder();
        console.log('[GoogleDriveBackup] Root backup folder ID:', rootFolderId);

        const backupFolders = googleConfig.backupFolders || [];

        for (const folderName of backupFolders) {
            // Local path (proje root'una göre)
            const localPath = path.join(process.cwd(), folderName);

            if (!fs.existsSync(localPath)) {
                console.warn(`[GoogleDriveBackup] Local folder not found, skipping: ${localPath}`);
                continue;
            }

            // Root altında bu klasörü oluştur / bul
            const driveFolderId = await findOrCreateFolder(drive, folderName, rootFolderId);
            console.log(`[GoogleDriveBackup] Syncing folder "${folderName}" to Drive (ID: ${driveFolderId})`);

            // İçeriği senkronize et
            await syncLocalFolderToDrive(drive, localPath, driveFolderId);
        }

        console.log('[GoogleDriveBackup] Backup sync finished.');

        // Başarılı durum
        return {
            status: 'success',
            message: 'Google Drive yedekleme işlemi başarıyla tamamlandı.',
        };
    } catch (error) {
        // Hata durumunda senin formatına uygun dön
        return {
            status: 'error',
            error,
            message: 'Google Drive yedekleme işlemi sırasında bir hata oluştu.',
        };
    }
}

module.exports = {
    getDriveClient,
    syncBackupFolders,
    findOrCreateFolder
};
