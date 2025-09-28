const { changeLanguage, t, getSupportedLanguages } = require('../../config/i18nConfig');

const languageMiddleware = async (req, res, next) => {
    try {
        // Önce özel header'ı kontrol et
        const customLanguage = req.headers['x-language'];
        // Accept-Language header'ından dil bilgisini al
        const acceptLanguage = req.headers['accept-language'];

        let language = process.env.DEFAULT_LANGUAGE;

        if (customLanguage) {
            // Özel header varsa bunu kullan
            language = customLanguage.toLowerCase();
        } else if (acceptLanguage) {
            // Özel header yoksa Accept-Language header'ından ilk dili al
            const languages = acceptLanguage.split(',');
            const primaryLang = languages[0].split('-')[0];
            language = primaryLang.toLowerCase();
        }

        // Desteklenen dilleri dinamik olarak al
        const supportedLanguages = getSupportedLanguages();

        // Hiç desteklenen dil yoksa middleware'i atla
        if (supportedLanguages.length === 0) {
            console.warn('Hiç desteklenen dil bulunamadı, çeviri devre dışı');
            req.language = null; // Dil bilgisi yok
            req.t = (key) => key; // Fallback: key'i olduğu gibi döndür
            return next();
        }

        // İstenen dil desteklenmiyor ise varsayılan dili kullan
        if (!supportedLanguages.includes(language)) {
            language = process.env.DEFAULT_LANGUAGE;
        }

        // Dili değiştir
        await changeLanguage(language);

        // Request objesine dil bilgisini ekle
        req.language = language;
        req.t = t; // Translation fonksiyonunu request'e ekle

        next();
    } catch (error) {
        // Dil değiştirme hatası durumunda güvenli fallback
        console.error('Language middleware error:', error);
        req.language = null;
        req.t = (key) => key; // Key'i olduğu gibi döndür
        next();
    }
};

module.exports = languageMiddleware;
