const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const path = require('path');
const fs = require('fs');

// Cache için global değişken - sadece başlangıçta bir kez yüklenir
let cachedSupportedLanguages = null;

/**
 * locales klasöründeki alt klasörleri okuyarak desteklenen dilleri bulur
 * Bu fonksiyon sadece başlangıçta bir kez çağrılır
 * Sadece gerçekte var olan dilleri döndürür
 * @returns {Array} Desteklenen dil kodları dizisi (gerçekte bulunanlar)
 */
function loadSupportedLanguages() {
    try {
        const localesPath = path.join(__dirname, '../../locales');

        // locales klasörü yoksa hata fırlat
        if (!fs.existsSync(localesPath)) {
            throw new Error('locales klasörü bulunamadı, hiç dil bulunamadı');
        }

        // locales klasöründeki tüm alt klasörleri oku
        const items = fs.readdirSync(localesPath, { withFileTypes: true });

        // Sadece klasörleri filtrele ve isimlerini al
        const languages = items
            .filter(item => item.isDirectory())
            .map(item => item.name)
            .filter(name => name.length === 2); // Sadece 2 karakterli dil kodlarını al (tr, en, fr, de, vb.)

        // Gerçekte bulunan dilleri döndür (boş olabilir)
        if (languages.length === 0) {
            throw new Error('locales klasöründe geçerli dil klasörü bulunamadı');
        }

        return languages.sort(); // Alfabetik sırala

    } catch (error) {
        throw new Error(`Desteklenen diller okunurken hata oluştu: ${error.message}`);
    }
}

/**
 * Cache'lenmiş desteklenen dilleri döndürür
 * Performans için sadece cache'den okur, dosya sistemine erişmez
 * @returns {Array} Desteklenen dil kodları dizisi (boş olabilir)
 */
function getSupportedLanguages() {
    if (!cachedSupportedLanguages) {
        console.warn('Desteklenen diller henüz yüklenmemiş, initializeI18n() çağrılmış mı?');
        return []; // Boş dizi döndür
    }
    return cachedSupportedLanguages;
}

async function initializeI18n() {
    try {
        // Desteklenen dilleri yükle ve cache'le (sadece bir kez)
        cachedSupportedLanguages = loadSupportedLanguages();

        await i18next
            .use(Backend)
            .init({
                lng: process.env.DEFAULT_LANGUAGE, // Varsayılan dil
                fallbackLng: 'en', // Fallback dil

                backend: {
                    loadPath: path.join(__dirname, '../../locales/{{lng}}/{{ns}}.json'),
                },

                ns: ['common', 'server', 'errors', 'validation', 'companies', 'users', 'accounts', 'transfers', 'auth'], // namespace'ler
                defaultNS: 'common',

                interpolation: {
                    escapeValue: false // React için gerekli değil
                }
            });

        return {
            status: 'success',
            message: `Desteklenen diller yüklendi: ${cachedSupportedLanguages.join(', ')}`
        };
    } catch (error) {
        throw {
            status: 'error',
            message: `i18next başlatılırken hata oluştu: ${error.message}`,
            originalError: error
        };
    }
}

function getI18nInstance() {
    return i18next;
}

function t(key, options = {}) {
    return i18next.t(key, options);
}

// Dil değiştirme fonksiyonu
function changeLanguage(lng) {
    return i18next.changeLanguage(lng);
}

module.exports = {
    initializeI18n,
    getI18nInstance,
    t,
    changeLanguage,
    getSupportedLanguages
};
