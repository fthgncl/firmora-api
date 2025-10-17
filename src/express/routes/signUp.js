/**
 * @swagger
 * /sign-up:
 *   post:
 *     summary: Kullanıcı kaydı
 *     description: Yeni kullanıcı kaydı oluşturur.
 *     operationId: signUp
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Kullanıcının adı
 *                 example: "Ahmet"
 *               surname:
 *                 type: string
 *                 description: Kullanıcının soyadı
 *                 example: "Yılmaz"
 *               username:
 *                 type: string
 *                 description: Kullanıcı adı
 *                 example: "ahmetyilmaz"
 *               email:
 *                 type: string
 *                 description: Kullanıcının email adresi
 *                 example: "ahmet@example.com"
 *               phone:
 *                 type: string
 *                 description: Kullanıcının telefon numarası
 *                 example: "05551234567"
 *               password:
 *                 type: string
 *                 description: Kullanıcının şifresi
 *                 example: "Parola123!"
 *               confirmpassword:
 *                 type: string
 *                 description: Şifre onayı
 *                 example: "Parola123!"
 *             required:
 *               - name
 *               - surname
 *               - username
 *               - email
 *               - phone
 *               - password
 *               - confirmpassword
 *     responses:
 *       201:
 *         description: Kullanıcı başarıyla oluşturuldu. E-posta doğrulama bağlantısı gönderilir (başarısız olursa warning alanı eklenir).
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
 *                   example: Kullanıcı başarıyla oluşturuldu. E-posta adresinize bir doğrulama bağlantısı gönderildi. Lütfen e-postanızı kontrol edin.
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Kullanıcı ID'si
 *                       example: "USR001"
 *                     name:
 *                       type: string
 *                       description: Kullanıcının adı
 *                       example: "Ahmet"
 *                     surname:
 *                       type: string
 *                       description: Kullanıcının soyadı
 *                       example: "Yılmaz"
 *                     username:
 *                       type: string
 *                       description: Kullanıcı adı
 *                       example: "ahmetyilmaz"
 *                     email:
 *                       type: string
 *                       description: Email adresi
 *                       example: "ahmet@example.com"
 *                     phone:
 *                       type: string
 *                       description: Telefon numarası
 *                       example: "05551234567"
 *                 warning:
 *                   type: string
 *                   description: E-posta gönderimi başarısız olursa eklenir (opsiyonel)
 *                   example: Doğrulama e-postası gönderilemedi. Lütfen daha sonra tekrar deneyin veya destek ekibiyle iletişime geçin.
 *       400:
 *         description: Geçersiz giriş bilgileri.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Verilen bilgilerde hatalar mevcut.
 *                 errors:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Ad boş bırakılamaz.
 *                     surname:
 *                       type: string
 *                       example: Soyad boş bırakılamaz.
 *                     username:
 *                       type: string
 *                       example: Kullanıcı adı boş bırakılamaz.
 *                     email:
 *                       type: string
 *                       example: Geçerli bir e-posta adresi girilmelidir.
 *                     phone:
 *                       type: string
 *                       example: Geçersiz telefon numarası formatı
 *                     password:
 *                       type: string
 *                       example: Şifre 8 ile 20 karakter uzunluğunda olmalı, büyük harf, küçük harf, rakam ve özel karakter içermelidir.
 *                     confirmpassword:
 *                       type: string
 *                       example: Şifreler eşleşmiyor.
 *       500:
 *         description: Sunucu hatası.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Sunucu hatası veya veritabanı hatası oluştu.
 *                 errors:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                       example: Bu kullanıcı adı zaten kullanılmaktadır. Lütfen farklı bir kullanıcı adı seçiniz.
 *                     email:
 *                       type: string
 *                       example: Bu email adresi zaten kullanılmaktadır. Lütfen farklı bir email adresi giriniz.
 *                     phone:
 *                       type: string
 *                       example: Bu telefon zaten kullanılmaktadır. Lütfen farklı bir telefon numarası giriniz.
 *                     general:
 *                       type: string
 *                       example: Bilinmeyen bir hata oluştu. Lütfen tekrar deneyin.
 */

const express = require('express');
const router = express.Router();
const createUser = require('../../database/users/createUser');
const validator = require('../../utils/validation');
const responseHelper = require('../utils/responseHelper');
const { isValidUsername, isValidPhone } = require("../../utils/validation");
const { cleanInputs } = require("../../utils/inputCleaner");
const { sendVerificationEmail } = require('../../express/services/emailService');
const { t } = require('../../config/i18nConfig');

// Error handling for duplicate entries
const getErrorMessages = (error) => {
    const errorMessages = {};
    if (error.code === 'ER_DUP_ENTRY') {
        if (error.sqlMessage.includes('username')) {
            errorMessages.username = t('errors:signUp.usernameInUse');
        }
        if (error.sqlMessage.includes('email')) {
            errorMessages.email = t('errors:signUp.emailInUse');
        }
        if (error.sqlMessage.includes('phone')) {
            errorMessages.phone = t('errors:signUp.phoneInUse');
        }
    } else {
        errorMessages.general = t('errors:signUp.unknownError');
    }
    return errorMessages;
};

router.post('/', async (req, res) => {
    const cleanedInput = cleanInputs({
        name: req.body.name,
        surname: req.body.surname,
        username: req.body.username,
        email: req.body.email,
        phone: req.body.phone
    });

    const { name, surname, username, email, phone } = cleanedInput;
    const password = req.body.password || '';
    const confirmpassword = req.body.confirmpassword || '';

    const errors = {};

    if (!name) {
        errors.name = t('errors:signUp.nameRequired');
    } else if (name.length < 3 || name.length > 20) {
        errors.name = t('errors:signUp.nameLength');
    } else if (!validator.isTextOnly(name)) {
        errors.name = t('errors:signUp.nameInvalid');
    }

    if (!surname) {
        errors.surname = t('errors:signUp.surnameRequired');
    } else if (surname.length < 3 || surname.length > 20) {
        errors.surname = t('errors:signUp.surnameLength');
    } else if (!validator.isTextOnly(surname)) {
        errors.surname = t('errors:signUp.surnameInvalid');
    }

    if (!username) {
        errors.username = t('errors:signUp.usernameRequired');
    } else if (!isValidUsername(username)) {
        if (username.length < 6 || username.length > 15) {
            errors.username = t('errors:signUp.usernameLength');
        } else if ((username.match(/\d/g) || []).length > 4) {
            errors.username = t('errors:signUp.usernameTooManyDigits');
        } else {
            errors.username = t('errors:signUp.usernameInvalidFormat');
        }
    }

    if (!email) {
        errors.email = t('errors:signUp.emailRequired');
    } else if (!validator.email(email)) {
        errors.email = t('errors:signUp.emailInvalid');
    }

    if (!phone) {
        errors.phone = t('errors:signUp.phoneRequired');
    } else if (!isValidPhone(phone)) {
        errors.phone = t('errors:signUp.phoneInvalid');
    }

    if (!password) {
        errors.password = t('errors:signUp.passwordRequired');
    } else if (!validator.password(password)) {
        errors.password = t('errors:signUp.passwordInvalid');
    }

    if (password !== confirmpassword) {
        errors.confirmpassword = t('errors:signUp.passwordMismatch');
    }

    if (Object.keys(errors).length > 0) {
        return responseHelper.error(res, t('errors:signUp.validationFailed'), 400, { errors });
    }

    try {
        const result = await createUser({ name, surname, username, email, password, phone });

        let emailSent = true;
        try {
            await sendVerificationEmail(result.user);
        } catch (emailError) {
            emailSent = false;
        }

        const responseData = {
            message: emailSent
                ? t('emails:signUp.accountCreatedWithVerification')
                : t('emails:signUp.accountCreated'),
            user: { ...result.user }
        };

        if (!emailSent) {
            responseData.warning = t('emails:signUp.verificationEmailFailed');
        }

        return responseHelper.success(res, responseData, 201);
    } catch (error) {
        const errorMessages = getErrorMessages(error);
        const statusCode = error.code === 'ER_DUP_ENTRY' ? 400 : 500;
        const message = error.code === 'ER_DUP_ENTRY'
            ? t('errors:signUp.duplicateEntry')
            : t('errors:signUp.serverError');

        return responseHelper.error(res, message, statusCode, { errors: errorMessages });
    }
});

module.exports = router;
