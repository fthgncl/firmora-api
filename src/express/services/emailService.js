const {createToken} = require("../../auth/jwt");
const {sendEmail} = require("../../services/emailService");

/**
 * Kullanıcıya e-posta doğrulama bağlantısı gönderir
 * @param {Object} user - Kullanıcı bilgileri
 * @returns {Promise<void>}
 */
const sendVerificationEmail = async (user) => {
    const token = createToken({...user}, process.env.EMAIL_VERIFICATION_TOKEN_LIFETIME);

    const verificationLink = `${process.env.APP_DOMAIN}/verify-email/${token}`;
    const signUpLink = `${process.env.APP_DOMAIN}/sign-up`;

    await sendEmail('verification.html', {
        NAME: user.name,
        SURNAME: user.surname,
        USERNAME: user.username,
        PHONE: user.phone,
        VERIFY_LINK: verificationLink,
        SIGNUP_URL: signUpLink
    }, user.email, 'E-posta Doğrulama');
};

/**
 * Kullanıcıya şifre sıfırlama bağlantısı gönderir
 * @param {Object} user - Kullanıcı bilgileri
 * @returns {Promise<void>}
 */
const sendPasswordResetEmail = async (user) => {

    const token = createToken({id: user.id, email: user.email}, process.env.PASSWORD_RESET_TOKEN_LIFETIME );

    // Şifre sıfırlama bağlantısı
    const resetLink = `${process.env.APP_DOMAIN}/reset-password/${token}`;

    // E-posta gönder
    await sendEmail('password-reset.html', {
        NAME: user.name,
        SURNAME: user.surname,
        USERNAME: user.username,
        RESET_LINK: resetLink
    }, user.email, 'Şifre Sıfırlama');
};


/**
 * E-posta değişikliği e-postalarını hazırlar ve gönderir
 * @param {object} options - E-posta gönderme seçenekleri
 * @param {object} options.user - Kullanıcı bilgileri
 * @param {string} options.currentEmail - Mevcut e-posta
 * @param {string} options.newEmail - Yeni e-posta
 * @param {string} options.currentEmailToken - Mevcut e-posta doğrulama tokeni
 * @param {string} options.newEmailToken - Yeni e-posta doğrulama tokeni
 * @returns {Promise<void>}
 */
async function sendEmailChangeEmails({ user, currentEmail, newEmail, currentEmailToken, newEmailToken }) {
    // Bağlantı URL'lerini oluştur
    const verifyCurrentLink = `${process.env.APP_DOMAIN}/verify-email-change/${encodeURIComponent(currentEmailToken)}`;
    const verifyNewLink = `${process.env.APP_DOMAIN}/verify-email-change/${encodeURIComponent(newEmailToken)}`;
    const cancelLink = `${process.env.APP_DOMAIN}/cancel-email-change/${encodeURIComponent(newEmailToken)}`;

    // Ortak değişkenler
    const commonVariables = {
        NAME: user.name,
        SURNAME: user.surname,
        USERNAME: user.username,
        CURRENT_EMAIL: currentEmail,
        NEW_EMAIL: newEmail
    };

    // E-postaları gönder
    await Promise.all([
        sendEmail('email-change-current.html', {
            ...commonVariables,
            VERIFY_LINK: verifyCurrentLink,
            CANCEL_LINK: cancelLink
        }, currentEmail, 'E-posta Değişikliği Onayı'),
        sendEmail('email-change-new.html', {
            ...commonVariables,
            VERIFY_LINK: verifyNewLink,
            CANCEL_LINK: cancelLink
        }, newEmail, 'E-posta Değişikliği Onayı')
    ]);
}

module.exports = {
    sendEmailChangeEmails,
    sendVerificationEmail,
    sendPasswordResetEmail
};