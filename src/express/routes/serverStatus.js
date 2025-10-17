/**
 * @swagger
 * /server-status:
 *   get:
 *     summary: Sunucunun durumunu kontrol eder.
 *     description: Sunucunun çalışıp çalışmadığını ve ortam bilgisini döner.
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Başarılı yanıt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Sunucu çalışıyor
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2024-12-01T10:20:30.123Z
 *                 environment:
 *                   type: string
 *                   example: development
 */

const express = require('express');
const router = express.Router();
const responseHelper = require('../utils/responseHelper');
const { t } = require('../../config/i18nConfig');

router.get('/', (req, res) => {
    return responseHelper.success(res, {
        message: t('server.running', { lng: req.language }),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown',
        language: req.language
    });
});

module.exports = router;
