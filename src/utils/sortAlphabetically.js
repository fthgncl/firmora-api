/**
 * Sorts characters in a string alphabetically and removes duplicates
 * @param {string} text - Input string to be sorted
 * @returns {string} Alphabetically sorted string without duplicates
 */
function sortAlphabetically(text) {
    // Convert text to array
    let array = text.split('');

    // Remove duplicate characters by converting to Set
    let uniqueArray = Array.from(new Set(array));

    // Sort array alphabetically
    let sortedArray = uniqueArray.sort();

    // Join sorted array to create result
    return sortedArray.join('');
}

module.exports = sortAlphabetically;
