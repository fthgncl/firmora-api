const { queryAsync } = require('../utils/connection');
const { t } = require('../../config/i18n.config');

const deleteUser = async (userId) => {
    try {
        const deleteSql = 'DELETE FROM users WHERE id = ?';
        const result = await queryAsync(deleteSql, [userId]);

        if (result.affectedRows === 0) {
            return { status: 'error', message: t('users:delete.notFound') };
        }

        return { status: 'success', message: t('users:delete.success') };
    } catch (error) {
        error.message = `${t('users:delete.error')} - ${error.message}`;
        throw error;
    }
};

module.exports = deleteUser;
