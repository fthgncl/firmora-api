/**
 * Şifre sıfırlama işlemleri için router ve endpoint tanımlamaları
 */

const express = require('express');
const router = express.Router();

// Handler fonksiyonlarını içe aktar
const requestReset = require('./passwordReset/requestReset');
// const changePassword = require('./passwordReset/changePassword');
const resetWithToken = require('./passwordReset/resetWithToken');

// Routes
router.post('/request', requestReset);
// router.post('/change', changePassword);
router.post('/token/:token', resetWithToken);

module.exports = router;
