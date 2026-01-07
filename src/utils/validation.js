const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*.]).{8,20}$/;
const textRegex = /^[a-zA-ZığüşöçİĞÜŞÖÇ\s]+$/;
const specialCharsRegex = /^[^'";=<>!&%$#@]+$/;
const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
const phoneRegex = /^\d{2,4}\d{10}$/;
const usernameRegex = /^[a-zA-ZığüşöçİĞÜŞÖÇ][a-zA-ZığüşöçİĞÜŞÖÇ0-9]{5,14}$/;
const companyIdRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const amountRegex = /^(?!0\d)\d+(\.\d{1,2})?$/;


const email = (email) => {
    return email && emailRegex.test(email);
};

const password = (password) => {
    return password && passwordRegex.test(password);
};

const isTextOnly = (text) => {
    return text && textRegex.test(text);
};

const hasSpecialChars = (text) => {
    return text && !specialCharsRegex.test(text);
};

const isValidHexColor = (color) => {
    return color && hexColorRegex.test(color);
};

const isValidPhone = (phone) => {
    return phone && phoneRegex.test(phone);
};

const isValidUsername = (username) => {
    if (!username) return false;

    // En fazla 4 rakam kontrolü
    const digitCount = (username.match(/\d/g) || []).length;
    if (digitCount > 4) return false;

    // Regex kontrolü (harfle başlar, sadece harf ve rakam içerir)
    return usernameRegex.test(username);
};

const isValidCompanyId = (Id) => {
    return Id && companyIdRegex.test(Id);
};

const isValidAmount = (amount) => {
    return amount && amountRegex.test(amount);
};

module.exports = {
    email,
    password,
    isTextOnly,
    hasSpecialChars,
    isValidHexColor,
    isValidPhone,
    isValidUsername,
    isValidCompanyId,
    isValidAmount
};