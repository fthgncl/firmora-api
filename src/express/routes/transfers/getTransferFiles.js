// src/express/routes/transfers/getTransferFiles.js

/**
 * @swagger
 * /transfers/files:
 *   post:
 *     summary: Transfer dosya listesini getir
 *     description: |
 *       Belirtilen transfer ID'sine ait dosyaların metadata'sını getirir.
 *       Her dosya için indirme URL'i döner.
 *       Kullanıcı, transfer'a erişim yetkisine sahip olmalıdır.
 *     tags:
 *       - Transfers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transferId
 *             properties:
 *               transferId:
 *                 type: string
 *                 description: Transfer ID
 *                 example: "TRF_b1f51e8cf04888c6"
 *     responses:
 *       200:
 *         description: Transfer dosya listesi başarıyla getirildi
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
 *                   example: "Transfer dosyaları başarıyla getirildi"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transferId:
 *                       type: string
 *                       example: "TRF_b1f51e8cf04888c6"
 *                     files:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           index:
 *                             type: integer
 *                             description: Dosya index'i
 *                             example: 0
 *                           fileName:
 *                             type: string
 *                             description: Dosya adı
 *                             example: "1762857472963_c22987a1673c8845.png"
 *                           size:
 *                             type: integer
 *                             description: Dosya boyutu (byte)
 *                             example: 204800
 *                           downloadUrl:
 *                             type: string
 *                             description: Dosya indirme URL'i
 *                             example: "/api/transfers/transfer-file/TRF_b1f51e8cf04888c6/0"
 *       400:
 *         description: Geçersiz transfer ID veya dosya bulunamadı
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
 *                   example: "Transfer ID gereklidir"
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
 *         description: Transfer veya dosyalar bulunamadı
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
 *                   example: "Transfer bulunamadı"
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

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const getTransferById = require('../../../database/transfers/getTransferById');
const {t} = require('../../../config/i18nConfig');
const responseHelper = require('../../utils/responseHelper');
const {canUserViewTransfer} = require("../../../utils/permissionsManager");
const {createToken, verifyToken} = require("../../../auth/jwt");

router.post('/files', async (req, res) => {
    try {
        const userId = req.tokenPayload?.id;
        const {transferId} = req.body;

        if (!userId) {
            return responseHelper.error(res, t('errors:auth.tokenMissing'), 401);
        }

        if (!transferId) {
            return responseHelper.error(res, t('transfers:getById.transferIdRequired'), 400);
        }

        const transfer = await getTransferById(transferId, ['files', 'user_id', 'company_id', 'to_user_id', 'to_user_company_id', 'from_scope', 'to_scope']);

        if (!await canUserViewTransfer(userId, transfer)) {
            return responseHelper.error(res, t('errors:permissions.cannotViewOtherUserTransferHistory'), 403);
        }

        if (!transfer) {
            return responseHelper.error(res, t('transfers:getById.notFound'), 404);
        }

        if (!transfer.files) {
            return responseHelper.error(res, t('transfers:files.noFiles'), 404);
        }

        // files JSON string'ini parse et
        let filePaths;
        try {
            filePaths = JSON.parse(transfer.files);
        } catch (parseError) {
            return responseHelper.error(res, t('transfers:files.invalidFormat'), 400);
        }

        if (!Array.isArray(filePaths) || filePaths.length === 0) {
            return responseHelper.error(res, t('transfers:files.noFiles'), 404);
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

                const fileToken = await createToken({transferId: transferId, fileIndex: i}, process.env.TOKEN_LIFETIME);

                fileResults.push({
                    size: fileStats.size,
                    downloadUrl: `/file/${fileToken}`
                });
            } catch (fileError) {
                console.error(`Dosya okunamadı: ${filePath}`, fileError);
                // Dosya okunamazsa atla, diğer dosyaları işlemeye devam et
            }
        }

        if (fileResults.length === 0) {
            return responseHelper.error(res, t('transfers:files.filesNotFound'), 404);
        }

        return responseHelper.success(res, {
            message: t('transfers:files.success'),
            transferId: transferId,
            files: fileResults
        });

    } catch (error) {
        if (error.status === 500) {
            return responseHelper.serverError(res, error);
        }
        return responseHelper.error(res, error.message);
    }
});

/**
 * @swagger
 * /transfers/file/{fileToken}:
 *   get:
 *     summary: Transfer dosyasını stream olarak indir
 *     description: |
 *       JWT token kullanarak transfer dosyasını stream olarak indirir.
 *       Token içerisinde transferId ve fileIndex bilgileri encode edilmiştir.
 *       Token, /transfers/files endpoint'inden alınan downloadUrl içerisinde bulunur.
 *       React'te <img>, <video> veya download link olarak kullanılabilir.
 *     tags:
 *       - Transfers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Transfer dosyası için JWT token (transferId ve fileIndex içerir)
 *         example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0cmFuc2ZlcklkIjoiVFJGX2IxZjUxZThjZjA0ODg4YzYiLCJmaWxlSW5kZXgiOjB9.xxxxx"
 *     responses:
 *       200:
 *         description: Dosya başarıyla stream edildi
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Geçersiz dosya index'i veya format hatası
 *       401:
 *         description: Token geçersiz veya eksik
 *       403:
 *         description: Erişim izni yok
 *       404:
 *         description: Transfer veya dosya bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.get('/file/:fileToken', async (req, res) => {
    try {
        const userId = req.tokenPayload?.id;
        const {fileToken} = req.params;

        // fileToken'ı decode et
        let transferId, fileIndex;
        try {
            const decoded = await verifyToken(fileToken);
            transferId = decoded.transferId;
            fileIndex = decoded.fileIndex;
        } catch (tokenError) {
            return responseHelper.error(res, t('errors:auth.invalidToken'), 401);
        }

        if (!userId) {
            return responseHelper.error(res, t('errors:auth.tokenMissing'), 401);
        }

        const transfer = await getTransferById(transferId, ['files', 'user_id', 'company_id', 'to_user_id', 'to_user_company_id', 'from_scope', 'to_scope']);

        if (!transfer) {
            return responseHelper.error(res, t('transfers:getById.notFound'), 404);
        }

        if (!await canUserViewTransfer(userId, transfer)) {
            return responseHelper.error(res, t('errors:permissions.cannotViewOtherUserTransferHistory'), 403);
        }

        if (!transfer.files) {
            return responseHelper.error(res, t('transfers:files.noFiles'), 404);
        }

        let filePaths;
        try {
            filePaths = JSON.parse(transfer.files);
        } catch (parseError) {
            return responseHelper.error(res, t('transfers:files.invalidFormat'), 400);
        }

        const index = parseInt(fileIndex);
        if (isNaN(index) || index < 0 || index >= filePaths.length) {
            return responseHelper.error(res, t('transfers:files.invalidIndex'), 400);
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
                    return responseHelper.error(res, t('transfers:files.sendError'), 500);
                }
            }
        });

    } catch (error) {
        if (error.code === 'ENOENT') {
            return responseHelper.error(res, t('transfers:files.fileNotFound'), 404);
        }
        if (error.status === 500) {
            return responseHelper.serverError(res, error);
        }
        return responseHelper.error(res, error.message);
    }
});

module.exports = router;
