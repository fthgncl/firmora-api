const { queryAsync } = require('../utils/connection');

const getUserByEmail = async (email) => {
    try {
        const sql = 'SELECT * FROM users WHERE email = ?';
        const results = await queryAsync(sql, [email]);

        if (results.length === 0) {
            return null;
        }

        return results[0];
    } catch (error) {
        throw error;
    }
};

module.exports = getUserByEmail;
