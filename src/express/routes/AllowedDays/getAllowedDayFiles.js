const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const {t} = require('../../../config/i18n.config');
const responseHelper = require('../../utils/responseHelper');
const {checkUserRoles} = require("../../../utils/permissionsManager");
const {createToken, verifyToken} = require("../../../auth/jwt");
const getAllowedDayById = require("../../../database/allowedDays/getAllowedDaysById");

/// MIME type belirleme fonksiyonu
// TODO: Mime type tesbit etmek için ayrı bir dosya oluşturulabilir. Ayrıca mime-types paketi de kullanılabilir.
const getMimeType = (extension) => {
    const mimeTypes = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'txt': 'text/plain',
        'csv': 'text/csv',
        'json': 'application/json',
        'xml': 'application/xml',
        'zip': 'application/zip',
        'rar': 'application/x-rar-compressed',
        '7z': 'application/x-7z-compressed',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'bmp': 'image/bmp',
        'svg': 'image/svg+xml',
        'webp': 'image/webp',
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'ogg': 'audio/ogg',
        'mp4': 'video/mp4',
        'avi': 'video/x-msvideo',
        'mkv': 'video/x-matroska',
        'mov': 'video/quicktime',
        'webm': 'video/webm'
    };
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
};

/**
 * @swagger
 * /user-allowed-days/files:
 *   post:
 *     summary: İzin günü dosya listesini getir
 *     description: |
 *       Belirtilen izin günü ID'sine ait dosyaların metadata'sını getirir.
 *       Her dosya için indirme URL'i döner.
 *       Kullanıcı, izin gününü görüntüleme yetkisine sahip olmalıdır.
 *     tags:
 *       - User Allowed Days
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - allowedDayId
 *             properties:
 *               allowedDayId:
 *                 type: string
 *                 description: İzin günü ID
 *                 example: "ALD_5be149a20df10d5d"
 *     responses:
 *       200:
 *         description: İzin günü dosya listesi başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "İzin günü dosyaları başarıyla getirildi"
 *                 data:
 *                   type: object
 *                   properties:
 *                     allowedDayId:
 *                       type: string
 *                       example: "ALD_5be149a20df10d5d"
 *                     files:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           fileName:
 *                             type: string
 *                             description: Dosyanın orijinal adı
 *                             example: "izin-belgesi.pdf"
 *                           mimeType:
 *                             type: string
 *                             description: Dosyanın MIME tipi
 *                             example: "application/pdf"
 *                           extension:
 *                             type: string
 *                             description: Dosya uzantısı
 *                             example: "pdf"
 *                           size:
 *                             type: integer
 *                             description: Dosya boyutu (byte)
 *                             example: 204800
 *                           downloadUrl:
 *                             type: string
 *                             description: JWT token içeren dosya indirme URL'i
 *                             example: "/file/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbGxvd2VkRGF5SWQiOiJBTERfNWJlMTQ5YTIwZGYxMGQ1ZCIsImZpbGVJbmRleCI6MH0.xxxxx"
 *       400:
 *         description: Geçersiz izin günü ID veya dosya bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "İzin günü ID gereklidir"
 *       401:
 *         description: Kimlik doğrulama hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Token eksik veya geçersiz"
 *       404:
 *         description: İzin günü veya dosyalar bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "İzin günü bulunamadı"
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Sunucu hatası"
 */
router.post('/files', async (req, res) => {
    try {
        const userId = req.tokenPayload?.id;
        const {allowedDayId} = req.body;

        if (!userId) {
            return responseHelper.error(res, t('errors:auth.tokenMissing'), 401);
        }

        if (!allowedDayId) {
            return responseHelper.error(res, t('allowedDays:getId.allowedDayIdRequired'), 400);
        }

        const {allowedDay} = await getAllowedDayById(allowedDayId);

        if (!allowedDay) {
            return responseHelper.error(res, t('allowedDays:getId.notFound'), 404);
        }

        if (!allowedDay.files) {
            return responseHelper.error(res, t('allowedDays:getFiles.noFiles'), 404);
        }

        // files JSON string'ini parse et
        let filePaths;
        try {
            filePaths = JSON.parse(allowedDay.files);
        } catch (parseError) {
            return responseHelper.error(res, t('allowedDays:getFiles.invalidFormat'), 400);
        }

        if (!Array.isArray(filePaths) || filePaths.length === 0) {
            return responseHelper.error(res, t('allowedDays:getFiles.noFiles'), 404);
        }

        // Her dosyanın metadata'sını topla
        const fileResults = [];
        const uploadsDir = path.join(process.cwd(), 'uploads');

        for (let i = 0; i < filePaths.length; i++) {
            const filePath = filePaths[i];
            try {
                // Backslash'leri forward slash'e çevir
                const normalizedPath = filePath.replace(/\\/g, '/');
                const fullPath = path.join(uploadsDir, normalizedPath);

                // Dosya var mı kontrol et
                await fs.access(fullPath);
                const fileStats = await fs.stat(fullPath);

                const fileToken = await createToken({allowedDayId, fileIndex: i}, process.env.TOKEN_LIFETIME);

                // Dosya bilgilerini al
                const fileName = path.basename(normalizedPath);
                const extension = path.extname(fileName).slice(1); // Nokta olmadan uzantı
                const mimeType = getMimeType(extension);

                fileResults.push({
                    fileName: fileName,
                    mimeType: mimeType,
                    extension: extension,
                    size: fileStats.size,
                    downloadUrl: `/file/${fileToken}`
                });
            } catch (fileError) {
                console.error(`Dosya okunamadı: ${filePath}`, fileError);
                // Dosya okunamazsa atla, diğer dosyaları işlemeye devam et
            }
        }

        if (fileResults.length === 0) {
            return responseHelper.error(res, t('allowedDays:getFiles.filesNotFound'), 404);
        }

        return responseHelper.success(res, {
            message: t('allowedDays:getFiles.success'),
            allowedDayId: allowedDay.id,
            files: fileResults
        });

    } catch (error) {
        if (error.status === 500) {
            return responseHelper.serverError(res, error);
        }
        return responseHelper.error(res, error.message);
    }
});


router.get('/file/:fileToken', async (req, res) => {
    try {
        const userId = req.tokenPayload?.id;
        const {fileToken} = req.params;

        // fileToken'ı decode et
        let allowedDayId, fileIndex;
        try {
            const decoded = await verifyToken(fileToken);
            allowedDayId = decoded.allowedDayId;
            fileIndex = decoded.fileIndex;
        } catch (tokenError) {
            return responseHelper.error(res, t('errors:auth.tokenInvalid'), 401);
        }

        if (!userId) {
            return responseHelper.error(res, t('errors:auth.tokenMissing'), 401);
        }


        const {allowedDay} = await getAllowedDayById(allowedDayId);

        if (!allowedDay) {
            return responseHelper.error(res, t('allowedDays:getId.notFound'), 404);
        }

        if (!allowedDay.files) {
            return responseHelper.error(res, t('allowedDays:getFiles.noFiles'), 404);
        }

        const hasPermission = await checkUserRoles(userId, allowedDay.company_id, ['can_view_users_work_status']);
        if (!hasPermission) {
            return responseHelper.error(res, t('workStatus:get.cannotAccessInCompany'), 403);
        }



        let filePaths;
        try {
            filePaths = JSON.parse(allowedDay.files);
        } catch (parseError) {
            return responseHelper.error(res, t('allowedDays:getFiles.invalidFormat'), 400);
        }

        const index = parseInt(fileIndex);
        if (isNaN(index) || index < 0 || index >= filePaths.length) {
            return responseHelper.error(res, t('allowedDays:getFiles.invalidIndex'), 400);
        }

        const filePath = filePaths[index];
        const normalizedPath = filePath.replace(/\\/g, '/');
        const uploadsDir = path.join(process.cwd(), 'uploads');
        const fullPath = path.join(uploadsDir, normalizedPath);

        // Dosya var mı kontrol et
        await fs.access(fullPath);

        // Dosyayı stream olarak gönder
        res.sendFile(fullPath, (err) => {
            if (err) {
                console.error('Dosya gönderme hatası:', err);
                if (!res.headersSent) {
                    return responseHelper.error(res, t('allowedDays:getFiles.sendError'), 500);
                }
            }
        });

    } catch (error) {
        if (error.code === 'ENOENT') {
            return responseHelper.error(res, t('allowedDays:getFiles.filesNotFound'), 404);
        }
        if (error.status === 500) {
            return responseHelper.serverError(res, error);
        }
        return responseHelper.error(res, error.message);
    }
});

module.exports = router;
