/**
 * @swagger
 * /sign-in:
 *   post:
 *     summary: Kullanıcı giriş işlemi
 *     description: Kullanıcı adı ve şifre ile giriş yaparak JWT token alır
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Kullanıcı adı
 *                 example: "john_doe"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Kullanıcı şifresi
 *                 example: "password123"
 *               rememberMe:
 *                 type: boolean
 *                 description: Beni hatırla seçeneği (token süresini uzatır)
 *                 example: false
 *     responses:
 *       200:
 *         description: Başarılı giriş
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
 *                   example: "Giriş başarılı"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Giriş başarılı"
 *                     token:
 *                       type: string
 *                       description: |
 *                         JWT access token. Token decode edildiğinde aşağıdaki bilgileri içerir:
 *                         - id: Kullanıcı ID'si
 *                         - username: Kullanıcı adı
 *                         - permissions: Kullanıcının şirket bazlı yetkileri (array)
 *                         - max_companies: Kullanıcının oluşturabileceği maksimum şirket sayısı
 *                         - rememberMe: Beni hatırla durumu
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *             examples:
 *               successWithPermissions:
 *                 summary: Yetkili kullanıcı girişi
 *                 value:
 *                   success: true
 *                   message: "Giriş başarılı"
 *                   data:
 *                     message: "Giriş başarılı"
 *                     token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     tokenPayload:
 *                       id: "USR_abc123"
 *                       username: "john_doe"
 *                       permissions:
 *                         - companyId: "COM_xyz789"
 *                           permissions: "abcdefgh"
 *                         - companyId: "COM_def456"
 *                           permissions: "xyz"
 *                       max_companies: 5
 *                       rememberMe: false
 *               successWithoutPermissions:
 *                 summary: Yetkisiz kullanıcı girişi
 *                 value:
 *                   success: true
 *                   message: "Giriş başarılı"
 *                   data:
 *                     message: "Giriş başarılı"
 *                     token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     tokenPayload:
 *                       id: "USR_abc123"
 *                       username: "john_doe"
 *                       permissions: []
 *                       max_companies: 5
 *                       rememberMe: false
 *       400:
 *         description: Gerekli alanlar eksik
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
 *                   example: "Kullanıcı adı ve şifre gereklidir"
 *       401:
 *         description: Geçersiz kullanıcı bilgileri
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
 *                   example: "Geçersiz kullanıcı adı veya şifre"
 *       403:
 *         description: E-posta doğrulanmamış
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
 *                   example: "E-posta adresiniz doğrulanmamış. Lütfen e-postanızı kontrol edin ve hesabınızı onaylayın."
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
const bcrypt = require('bcryptjs');
const router = express.Router();
const { queryAsync } = require('../../database/utils/connection');
const { createToken } = require("../../auth/jwt");
const responseHelper = require('../utils/responseHelper');
const { t } = require('../../config/i18nConfig');
const { readUserPermissions } = require('../../utils/permissionsManager');
const {cleanInputs} = require("../../utils/inputCleaner");

router.post('/', async (req, res) => {

    const { username, password, rememberMe } = cleanInputs(req.body);

    if (!username || !password) {
        return responseHelper.error(res, t('errors:signIn.fieldsRequired'), 400);
    }

    try {
        const query = `
      SELECT id, username, password, max_companies, emailverified
      FROM users
      WHERE username = ?
      LIMIT 1
    `;
        const users = await queryAsync(query, [username]);

        if (users.length === 0) {
            return responseHelper.error(res, t('errors:signIn.invalidCredentials'), 401);
        }

        const user = users[0];

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return responseHelper.error(res, t('errors:signIn.invalidCredentials'), 401);
        }

        if (!user.emailverified) {
            return responseHelper.error(res, t('errors:signIn.emailNotVerified'), 403);
        }

        const userPermissionsData = await readUserPermissions(user.id);
        const permissions = userPermissionsData.permissions || [];

        const tokenPayload = {
            id: user.id,
            username: user.username,
            permissions: permissions,
            max_companies: user.max_companies,
            rememberMe: !!rememberMe
        };

        const tokenLifetime = rememberMe
            ? process.env.REMEMBER_ME_TOKEN_LIFETIME
            : process.env.DEFAULT_TOKEN_LIFETIME;
        const token = await createToken(tokenPayload, tokenLifetime);

        return responseHelper.success(res, {
            message: t('auth:signIn.success'),
            token
        });

    } catch (error) {
        return responseHelper.serverError(res, error);
    }
});

module.exports = router;
