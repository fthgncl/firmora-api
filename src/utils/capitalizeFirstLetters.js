function capitalizeFirstLetters(text) {
    return text.replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .map(word => {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
}

module.exports = capitalizeFirstLetters;
