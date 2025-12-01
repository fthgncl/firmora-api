const {createToken} = require("../../auth/jwt");
const {sendEmail} = require("../../services/emailService");
const {t} = require("../../config/i18n.config");

/**
 * Kullanıcıya e-posta doğrulama bağlantısı gönderir
 * @param {Object} user - Kullanıcı bilgileri
 * @returns {Promise<void>}
 */
const sendVerificationEmail = async (user) => {
    const token = createToken({...user}, process.env.EMAIL_VERIFICATION_TOKEN_LIFETIME);

    const verificationLink = `${process.env.APP_DOMAIN}/verify-email/${token}`;
    const signUpLink = `${process.env.APP_DOMAIN}/sign-up`;

    // Çeviri metinlerini al
    const greeting = t('emails:templates.verification.greeting', { name: user.name });
    const welcome = t('emails:templates.verification.welcome');
    const instructions = t('emails:templates.verification.instructions');
    const nameLabel = t('emails:templates.verification.name');
    const surnameLabel = t('emails:templates.verification.surname');
    const usernameLabel = t('emails:templates.verification.username');
    const phoneLabel = t('emails:templates.verification.phone');
    const verifyButton = t('emails:templates.verification.verifyButton');
    const wrongInfoButton = t('emails:templates.verification.wrongInfoButton');
    const subject = t('emails:templates.verification.subject');

    await sendEmail('verification.html', {
        GREETING: greeting,
        WELCOME: welcome,
        INSTRUCTIONS: instructions,
        NAME_LABEL: nameLabel,
        SURNAME_LABEL: surnameLabel,
        USERNAME_LABEL: usernameLabel,
        PHONE_LABEL: phoneLabel,
        NAME: user.name,
        SURNAME: user.surname,
        USERNAME: user.username,
        PHONE: user.phone,
        VERIFY_LINK: verificationLink,
        SIGNUP_URL: signUpLink,
        VERIFY_BUTTON: verifyButton,
        WRONG_INFO_BUTTON: wrongInfoButton
    }, user.email, subject);
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

    // Çeviri metinlerini al
    const greeting = t('emails:templates.passwordReset.greeting', { name: user.name });
    const title = t('emails:templates.passwordReset.title');
    const instructions = t('emails:templates.passwordReset.instructions');
    const nameLabel = t('emails:templates.passwordReset.name');
    const surnameLabel = t('emails:templates.passwordReset.surname');
    const usernameLabel = t('emails:templates.passwordReset.username');
    const resetButton = t('emails:templates.passwordReset.resetButton');
    const ignoreMessage = t('emails:templates.passwordReset.ignoreMessage');
    const subject = t('emails:templates.passwordReset.subject');
    const signature = t('emails:templates.passwordReset.signature', { appName: process.env.PROJECT_NAME });
    const autoEmailNotice = t('emails:templates.passwordReset.autoEmailNotice');

    // E-posta gönder
    await sendEmail('password-reset.html', {
        GREETING: greeting,
        TITLE: title,
        INSTRUCTIONS: instructions,
        NAME_LABEL: nameLabel,
        SURNAME_LABEL: surnameLabel,
        USERNAME_LABEL: usernameLabel,
        NAME: user.name,
        SURNAME: user.surname,
        USERNAME: user.username,
        RESET_LINK: resetLink,
        RESET_BUTTON: resetButton,
        IGNORE_MESSAGE: ignoreMessage,
        SIGNATURE: signature,
        AUTO_EMAIL_NOTICE: autoEmailNotice
    }, user.email, subject);
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

    // Çeviri metinlerini al
    const subject = t('emails:templates.emailChange.subject');

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
        }, currentEmail, subject),
        sendEmail('email-change-new.html', {
            ...commonVariables,
            VERIFY_LINK: verifyNewLink,
            CANCEL_LINK: cancelLink
        }, newEmail, subject)
    ]);
}

module.exports = {
    sendEmailChangeEmails,
    sendVerificationEmail,
    sendPasswordResetEmail
};