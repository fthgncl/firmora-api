const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const {queryAsync} = require('../../database/utils/connection');
const {createToken} = require("../../auth/jwt");
const responseHelper = require('../utils/responseHelper');
const { t } = require('../../config/i18nConfig');

router.post('/', async (req, res) => {
    const {username, password, rememberMe} = req.body;

    // Gerekli alanları kontrol et
    if (!username || !password) {
        return responseHelper.error(res, t('auth.signIn.fieldsRequired'), 400);
    }

    try {
        // Kullanıcıyı veritabanında ara
        const query = `
            SELECT id, username, email, password
            FROM users
            WHERE username = ?
            LIMIT 1
        `;
        const users = await queryAsync(query, [username]);

        if (users.length === 0) {
            return responseHelper.error(res, t('auth.signIn.invalidCredentials'), 401);
        }

        const user = users[0];

        // Şifre kontrolü
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return responseHelper.error(res, t('auth.signIn.invalidCredentials'), 401);
        }

        // Token oluştur
        const tokenPayload = {id: user.id, username: user.username, email: user.email, rememberMe: !!rememberMe};
        const tokenLifetime = rememberMe ? process.env.REMEMBER_ME_TOKEN_LIFETIME : process.env.DEFAULT_TOKEN_LIFETIME;
        const token = await createToken(tokenPayload, tokenLifetime);

        return responseHelper.success(res, {
            message: t('auth.signIn.success'),
            token
        });

    } catch (error) {
        console.error('Giriş hatası:', error);
        return responseHelper.serverError(res, error);
    }
});

module.exports = router;