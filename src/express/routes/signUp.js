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
 *         description: Kullanıcı başarıyla oluşturuldu.
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
 *                   example: Kullanıcı başarıyla oluşturuldu.
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: Kullanıcı ID'si
 *                       example: 1
 *                     username:
 *                       type: string
 *                       description: Kullanıcı adı
 *                       example: "ahmetyilmaz"
 *                     email:
 *                       type: string
 *                       description: Email adresi
 *                       example: "ahmet@example.com"
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
const {isValidUsername, isValidPhone} = require("../../utils/validation");
const {cleanInputs} = require("../../utils/inputCleaner");

// Error handling for duplicate entries
const getErrorMessages = (error) => {
    const errorMessages = {};
    if (error.code === 'ER_DUP_ENTRY') {
        if (error.sqlMessage.includes('username')) {
            errorMessages.username = 'Bu kullanıcı adı zaten kullanılmaktadır. Lütfen farklı bir kullanıcı adı seçiniz.';
        }
        if (error.sqlMessage.includes('email')) {
            errorMessages.email = 'Bu email adresi zaten kullanılmaktadır. Lütfen farklı bir email adresi giriniz.';
        }
        if (error.sqlMessage.includes('phone')) {
            errorMessages.email = 'Bu telefon zaten kullanılmaktadır. Lütfen farklı bir telefon numarası giriniz.';
        }
    } else {
        errorMessages.general = 'Bilinmeyen bir hata oluştu. Lütfen tekrar deneyin.';
    }
    return errorMessages;
};

router.post('/', async (req, res) => {

    // Input değerlerini temizle
    const cleanedInput = cleanInputs({
        name: req.body.name,
        surname: req.body.surname,
        username: req.body.username,
        email: req.body.email,
        phone: req.body.phone
    });

    const {name, surname, username, email, phone} = cleanedInput;
    const password = req.body.password || '';
    const confirmpassword = req.body.confirmpassword || '';

    const errors = {};

    // Name validation (minimum 3 characters and maximum 20 characters)
    if (!name) {
        errors.name = 'Ad boş bırakılamaz.';
    } else if (name.length < 3 || name.length > 20) {
        errors.name = 'Ad en az 3 ve en fazla 20 karakter uzunluğunda olabilir.';
    } else if (!validator.isTextOnly(name)) {
        errors.name = 'Ad sadece harflerden oluşmalıdır.';
    }

    // Surname validation (minimum 3 characters and maximum 20 characters)
    if (!surname) {
        errors.surname = 'Soyad boş bırakılamaz.';
    } else if (surname.length < 3 || surname.length > 20) {
        errors.surname = 'Soyad en az 3 ve en fazla 20 karakter uzunluğunda olabilir.';
    } else if (!validator.isTextOnly(surname)) {
        errors.surname = 'Soyad sadece harflerden oluşmalıdır.';
    }

    // Username validation (required, max 15 characters)
    if (!username) {
        errors.username = 'Kullanıcı adı boş bırakılamaz.';
    } else if (!isValidUsername(username)) {
        if (username.length < 6 || username.length > 15) {
            errors.username = 'Kullanıcı adı en az 6 ve en fazla 15 karakter uzunluğunda olabilir.';
        } else if ((username.match(/\d/g) || []).length > 4) {
            errors.username = 'Kullanıcı adı en fazla 4 rakam içerebilir.';
        } else {
            errors.username = 'Kullanıcı adı harfle başlamalı ve sadece harf ile rakam içermelidir.';
        }
    }

    // Email validation (required, must follow email format)
    if (!email) {
        errors.email = 'E-posta boş bırakılamaz.';
    } else if (!validator.email(email)) {
        errors.email = 'Geçerli bir e-posta adresi girilmelidir.';
    }

    if (!phone) {
        errors.phone = 'Telefon numarası gereklidir.';
    }

    if (!isValidPhone(phone)) {
        errors.phone = 'Geçersiz telefon numarası formatı.';
    }

    // Password validation (required)
    if (!password) {
        errors.password = 'Şifre boş bırakılamaz.';
    } else if (!validator.password(password)) {
        errors.password = 'Şifre 8 ile 20 karakter uzunluğunda olmalı, büyük harf, küçük harf, rakam ve özel karakter içermelidir.';
    }

    // Password confirmation validation (must match)
    if (password !== confirmpassword) {
        errors.confirmpassword = 'Şifreler eşleşmiyor.';
    }

    // If there are any validation errors, return them
    if (Object.keys(errors).length > 0) {
        return responseHelper.error(res, 'Verilen bilgilerde hatalar mevcut.', 400, { errors });
    }

    try {
        // Create the user
        const result = await createUser({name, surname, username, email, password, phone});
        return responseHelper.success(res, {
            message: 'Kullanıcı başarıyla oluşturuldu.',
            user: { ...result.user }
        }, 201);
    } catch (error) {
        // Handle errors (duplicate entries)
        const errorMessages = getErrorMessages(error);

        // Mükerrer kayıt hatası için 400 durum kodu kullan
        const statusCode = error.code === 'ER_DUP_ENTRY' ? 400 : 500;
        const message = error.code === 'ER_DUP_ENTRY' 
            ? 'Girilen bilgiler başka bir kullanıcı tarafından kullanılıyor.'
            : 'Sunucu hatası veya veritabanı hatası oluştu.';

        return responseHelper.error(res, message, statusCode, { errors: errorMessages });
    }
});

module.exports = router;