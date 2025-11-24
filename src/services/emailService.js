const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

/**
 * Genel amaçlı e-posta gönderme fonksiyonu
 * @param {string} templateName - E-posta şablonunun adı (örn: 'verification.html')
 * @param {Object} data - Şablonda değiştirilecek değerler
 * @param {string} to - Alıcı e-posta adresi
 * @param {string} subject - E-posta konusu
 * @returns {Promise<void>}
 */
const sendEmail = async (templateName, data, to, subject) => {

    // Proje kök dizinini belirleme
    const projectRoot = process.cwd();
    const templatePath = path.join(projectRoot, 'src', 'emailTemplates', templateName);

    // HTML şablonunu oku
    let emailTemplate = fs.readFileSync(templatePath, 'utf-8');

    // Şablondaki yer tutucuları değiştir
    Object.keys(data).forEach(key => {
        emailTemplate = emailTemplate.replaceAll(`[${key}]`, data[key]);
    });

    // Nodemailer transporter oluştur
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        }
    });


    // Logo dosyasının yolunu belirle
    const logoPath = path.join(projectRoot, 'src', 'images', 'logo192.png');

    const mailOptions = {
        from: `"Destek Ekibi" <${process.env.APP_SUPPORT_EMAIL}>`,
        to: to,
        subject: subject,
        html: emailTemplate,
        attachments: [
            {
                filename: 'logo192.png',
                path: logoPath,
                cid: 'company-logo' // CID (Content-ID) referansı
            }
        ]
    };

    // E-posta gönderme işlemi
    await transporter.sendMail(mailOptions);
};

module.exports = {
    sendEmail
};
