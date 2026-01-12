/**
 * @swagger
 * /accounts:
 *   get:
 *     summary: Kullanıcının hesaplarını listele
 *     description: Token'dan alınan kullanıcıya ait tüm hesapları getirir.
 *     tags:
 *       - Accounts
 *     responses:
 *       200:
 *         description: Hesaplar başarıyla getirildi
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
 *                   example: "Hesaplar başarıyla getirildi"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       description: Kullanıcı bilgileri
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "Ahmet"
 *                         surname:
 *                           type: string
 *                           example: "Yılmaz"
 *                     accounts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "ACC_1a2b3c4d5e6f7g8h"
 *                           user_id:
 *                             type: string
 *                             example: "USR_f1eb361f6dcd6ba4"
 *                           company_id:
 *                             type: string
 *                             example: "COM_547dc37210f0157d"
 *                           currency:
 *                             type: string
 *                             example: "EUR"
 *                           balance:
 *                             type: number
 *                             format: decimal
 *                             example: 1500.50
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-01-15T10:30:00Z"
 *                           is_working:
 *                             type: integer
 *                             nullable: true
 *                             enum: [0, 1, 2]
 *                             description: |
 *                               Kullanıcının çalışma durumu
 *
 *                               **Değerler:**
 *                               - `0`: Çalışmıyor
 *                               - `1`: Çalışıyor
 *                               - `2`: Mazeretli
 *                             example: 1
 *                           company:
 *                             type: object
 *                             nullable: true
 *                             description: Hesaba ait firma bilgileri
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "COM_547dc37210f0157d"
 *                               company_name:
 *                                 type: string
 *                                 example: "Örnek Teknoloji A.Ş."
 *                               sector:
 *                                 type: string
 *                                 nullable: true
 *                                 example: "Teknoloji"
 *                               currency:
 *                                 type: string
 *                                 example: "EUR"
 *                               balance:
 *                                 type: number
 *                                 format: decimal
 *                                 example: 50000.00
 *                               owner_id:
 *                                 type: string
 *                                 example: "USR_f1eb361f6dcd6ba4"
 *                               created_at:
 *                                 type: string
 *                                 format: date-time
 *                                 example: "2025-01-10T08:00:00Z"
 *       401:
 *         description: Token geçersiz veya eksik
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
 *                   example: "Geçersiz token"
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
const getAccountsByUserId = require('../../../database/accounts/getAccountsByUserId');
const responseHelper = require('../../utils/responseHelper');
const { t } = require('../../../config/i18n.config');
const {getAllowedDaysByUserId} = require("../../../database/allowedDays");

router.get('/', async (req, res) => {
    try {
        // Token'dan userId'yi al
        const userId = req.tokenPayload?.id;
        if (!userId) {
            return responseHelper.error(res, t('errors:auth.tokenMissing'), 401);
        }

        // Kullanıcının hesaplarını getir
        const { accounts, message, user } = await getAccountsByUserId(userId);

        const accountsWithIsWorking = await Promise.all(accounts.map( async account => {
            const now = new Date();
            const {allowedDays} = await getAllowedDaysByUserId(userId, account.company.id , now, now);
            if ( allowedDays.length > 0) {
                account.is_working = 2;
            }
            return account;
        }));

        return responseHelper.success(res, { accounts:accountsWithIsWorking, message, user });

    } catch (error) {
        return responseHelper.serverError(res, error);
    }
});

module.exports = router;