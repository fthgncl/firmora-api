/**
 * Türkçe karakterleri doğru şekilde küçük harfe çevirir
 * @param {string} text - Çevirilecek metin
 * @returns {string} Küçük harfli metin
 */
function turkishToLower(text) {
    const letters = { "İ": "i", "I": "ı", "Ş": "ş", "Ğ": "ğ", "Ü": "ü", "Ö": "ö", "Ç": "ç" };
    return text.replace(/[İIŞĞÜÇÖ]/g, letter => letters[letter] || letter).toLowerCase();
}

/**
 * Türkçe karakterleri doğru şekilde büyük harfe çevirir
 * @param {string} text - Çevirilecek metin
 * @returns {string} Büyük harfli metin
 */
function turkishToUpper(text) {
    const letters = { "i": "İ", "ı": "I", "ş": "Ş", "ğ": "Ğ", "ü": "Ü", "ö": "Ö", "ç": "Ç" };
    return text.replace(/[iışğüöç]/g, letter => letters[letter] || letter).toUpperCase();
}

/**
 * Türkçe karakterleri destekleyen capitalize fonksiyonu - her kelimenin ilk harfini büyük yapar
 * @param {string} text - Capitalize edilecek metin
 * @returns {string} Her kelimenin ilk harfi büyük olan metin
 */
function turkishCapitalize(text) {
    if (!text) return '';
    return text
        .split(' ')
        .map(word => {
            if (!word) return word;
            const firstChar = word.charAt(0);
            const restChars = word.slice(1);
            return turkishToUpper(firstChar) + turkishToLower(restChars);
        })
        .join(' ');
}

/**
 * E-posta adresini temizler
 * @param {string} email - Temizlenecek e-posta
 * @returns {string} Temizlenmiş e-posta
 */
function cleanEmailInput(email) {
    if (!email || typeof email !== 'string') return '';
    return email
        .replace(/\s+/g, '') // Tüm boşlukları kaldır
        .replace(/[<>]/g, '') // HTML etiketlerini kaldır
        .replace(/[^a-zA-Z0-9@._+-]/g, '') // Email için geçerli karakterler dışındakileri kaldır
        .toLowerCase()
        .trim();
}

/**
 * Kullanıcı adını temizler
 * @param {string} username - Temizlenecek kullanıcı adı
 * @returns {string} Temizlenmiş kullanıcı adı
 */
function cleanUsernameInput(username) {
    if (!username || typeof username !== 'string') return '';
    return turkishToLower(username.trim()).replace(/\s+/g, '');
}

/**
 * Telefon numarasını temizler
 * @param {string} phone - Temizlenecek telefon numarası
 * @returns {string|null} Temizlenmiş telefon numarası veya null
 */
function cleanPhoneInput(phone) {
    if (!phone || typeof phone !== 'string') return null;
    return phone.replace(/\D/g, '');
}

/**
 * İsim veya soyisim için özel temizleme (ilk harfleri büyük yapar)
 * @param {string} text - Temizlenecek metin
 * @returns {string} Temizlenmiş ve capitalize edilmiş metin
 */
function cleanNameInput(text) {
    if (!text || typeof text !== 'string') return '';

    return text
        .replace(/[<>]/g, '') // Potansiyel HTML/XML etiketlerini kaldır
        .replace(/[^a-zA-ZçğıöşüÇĞIİÖŞÜ\s]/g, '') // Sadece harf, boşluk ve Türkçe karakterlere izin ver
        .replace(/\s+/g, ' ') // Çoklu boşlukları tek boşluğa çevir
        .trim()
        .split(' ')
        .map(word => turkishCapitalize(word))
        .join(' ');
}

/**
 * Para birimi kodunu temizler (3 harfli büyük harf formatına çevirir)
 * @param {string} currency - Temizlenecek para birimi kodu
 * @returns {string} Temizlenmiş para birimi kodu (örn: TRY, USD, EUR)
 */
function cleanCurrencyInput(currency) {
    if (!currency || typeof currency !== 'string') return '';
    return currency
        .replace(/\s+/g, '') // Tüm boşlukları kaldır
        .replace(/[^a-zA-Z]/g, '') // Sadece harflere izin ver
        .toUpperCase() // Büyük harfe çevir
        .trim();
}


/**
 * Genel input temizleme fonksiyonu - anahtar ismine göre temizleme yapar ve güvenlik kontrolleri uygular
 * @param {object} inputData - Temizlenecek veri objesi
 * @returns {object} Temizlenmiş veri objesi
 */
function cleanInputs(inputData) {
    if (!inputData || typeof inputData !== 'object') return {};

    const cleanedData = {};

    // Her alanı önce güvenlik kontrolünden geçir, sonra anahtarına göre temizle
    Object.keys(inputData).forEach(key => {
        let value = inputData[key];

        // Sonra alan tipine göre temizle
        switch (key) {
            case 'name':
            case 'surname':
                cleanedData[key] = cleanNameInput(value);
                break;
            case 'username':
                cleanedData[key] = cleanUsernameInput(value);
                break;
            case 'email':
                cleanedData[key] = cleanEmailInput(value);
                break;
            case 'company_name':
                cleanedData[key] = cleanNameInput(value);
                break;
            case 'sector':
                cleanedData[key] = cleanNameInput(value);
                break;
            case 'currency':
                cleanedData[key] = cleanCurrencyInput(value);
                break;
            default:
                cleanedData[key] = value;
                break;
        }
    });

    return cleanedData;
}

module.exports = { cleanInputs };
