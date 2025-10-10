const { queryAsync } = require('../utils/connection');
const { generateUniqueId } = require('../../utils/idUtils');
const { t } = require('../../config/i18nConfig');
const { checkUserRoles, readUserPermissions } = require('../../utils/permissionsManager');
const getUserById = require('../users/getUserById');

const createTransfer = async (transferData, userId, companyId) => {
    try {
        // Transfer tipine göre yetkilendirme kontrolü
        const hasPermission = await validateTransferPermissions(transferData, userId, companyId);

        if (!hasPermission) {
            throw {
                status: 403,
                message: t('transfers.create.noPermission')
            };
        }

        const transferId = await generateUniqueId('TRF', 'transfers');
        const processedTransferData = await prepareTransferData(transferData, transferId, userId, companyId);
        await insertTransferToDatabase(processedTransferData);

        return {
            status: 'success',
            message: t('transfers.create.success'),
            transfer: {
                id: transferId,
                type: processedTransferData.type,
                amount: processedTransferData.amount,
                currency: processedTransferData.currency,
                description: processedTransferData.description
            }
        };
    } catch (error) {
        if (error.status) {
            throw error;
        }
        throw {
            status: 500,
            message: `${t('transfers.create.error')} - ${error.message}`
        };
    }
};

const validateTransferPermissions = async (transferData, userId, companyId) => {

    // Transfer tipleri:
    // 'internal' - Aynı firmadaki kullanıcıya transfer
    // 'external_company' - Farklı firmadaki kullanıcıya transfer
    // 'external_person' - Hiç olmayan kullanıcıdan/kullanıcıya transfer kaydı
    // 'expense' - Gider ödemesi

    switch (transferData.type) {
        case 'internal':
            // Aynı firma içi transfer yetkisi
            return await checkUserRoles(userId, companyId, ['can_transfer_internal']);

        case 'external_company':
            // Farklı firmaya transfer yetkisi
            return await checkUserRoles(userId, companyId, ['can_transfer_external']);

        case 'external_person':
            // Harici kişiden/kişiye transfer kaydı yetkisi
            return await checkUserRoles(userId, companyId, ['can_transfer_external']);

        case 'expense':
            // Gider kaydı yetkisi
            return await checkUserRoles(userId, companyId, ['can_record_expense']);

        default:
            return false;
    }
};

const prepareTransferData = async (transferData, transferId, userId, companyId) => {
    const {
        type,
        amount,
        currency,
        description,
        to_user_id,
        from_user_id,
        external_person_name,
        expense_category
    } = transferData;

    // Zorunlu alanlar kontrolü
    if (!type || !amount || !currency) {
        throw {
            status: 400,
            message: t('transfers.create.missingFields')
        };
    }

    // Transfer tipine göre validasyon
    await validateTransferData(type, transferData, userId, companyId);

    return {
        id: transferId,
        company_id: companyId,
        created_by: userId,
        type: type,
        amount: parseFloat(amount),
        currency: currency.toUpperCase(),
        description: description || null,
        to_user_id: to_user_id || null,
        from_user_id: from_user_id || null,
        external_person_name: external_person_name || null,
        expense_category: expense_category || null,
        status: 'completed', // completed, pending, cancelled TODO: İlerde alan kişi tarafından onay beklenebilir.
        created_at: new Date()
    };
};

const validateTransferData = async (type, transferData, userId, companyId) => {
    const { to_user_id, from_user_id, external_person_name, expense_category } = transferData;

    switch (type) {
        case 'internal':
            // Aynı firma içi transfer - to_user_id veya from_user_id gerekli
            if (!to_user_id && !from_user_id) {
                throw {
                    status: 400,
                    message: t('transfers.create.internalTransferRequiresUser')
                };
            }

            // Kullanıcının aynı firmada olduğunu kontrol et
            if (to_user_id) {
                await validateUserInCompany(to_user_id, companyId);
            }
            if (from_user_id) {
                await validateUserInCompany(from_user_id, companyId);
            }

            // Kullanıcı kendisine para gönderemez
            if (to_user_id === userId || from_user_id === userId) {
                throw {
                    status: 400,
                    message: t('transfers.create.cannotTransferToSelf')
                };
            }
            break;

        case 'external_company':
            // Farklı firmaya transfer - to_user_id veya from_user_id gerekli
            if (!to_user_id && !from_user_id) {
                throw {
                    status: 400,
                    message: t('transfers.create.externalTransferRequiresUser')
                };
            }

            // Kullanıcının var olduğunu kontrol et
            if (to_user_id) {
                await validateUserExists(to_user_id);
            }
            if (from_user_id) {
                await validateUserExists(from_user_id);
            }
            break;

        case 'external_person':
            // Harici kişi transferi - external_person_name gerekli
            if (!external_person_name) {
                throw {
                    status: 400,
                    message: t('transfers.create.externalPersonNameRequired')
                };
            }
            break;

        case 'expense':
            // Gider kayd1 - expense_category gerekli
            if (!expense_category) {
                throw {
                    status: 400,
                    message: t('transfers.create.expenseCategoryRequired')
                };
            }
            break;

        default:
            throw {
                status: 400,
                message: t('transfers.create.invalidType')
            };
    }
};

const validateUserInCompany = async (userId, companyId) => {
    try {
        const result = await readUserPermissions(userId, companyId);

        // Eğer kullanıcının bu firmada herhangi bir yetkisi varsa, firmada bulunuyor demektir
        if (!result.permissions || result.permissions.length === 0) {
            throw {
                status: 400,
                message: t('transfers.create.userNotInCompany')
            };
        }
    } catch (error) {
        throw {
            status: 400,
            message: t('transfers.create.userNotInCompany')
        };
    }
};

const validateUserExists = async (userId) => {
    const user = await getUserById(userId, ['id']);

    if (!user) {
        throw {
            status: 400,
            message: t('transfers.create.userNotFound')
        };
    }
};

const insertTransferToDatabase = async (transferData) => { // TODO: Bu fonksiyon projenin farklı yerlerinde de kullanılmaktadır. Bu fonksiyonu utils içine taşı.
    const columns = Object.keys(transferData).join(", ");
    const values = Object.values(transferData);
    const placeholders = values.map(() => '?').join(", ");

    const sql = `INSERT INTO transfers (${columns}) VALUES (${placeholders})`;
    await queryAsync(sql, values);
};

module.exports = createTransfer;
