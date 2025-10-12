const { queryAsync } = require('../utils/connection');
const { generateUniqueId } = require('../../utils/idUtils');
const { t } = require('../../config/i18nConfig');
const { checkUserRoles, readUserPermissions } = require('../../utils/permissionsManager');
const getUserById = require('../users/getUserById');

const createTransfer = async (transferData, userId, companyId) => {
    try {
        // TODO: gönderilen ve alınan para birimleri aynı olmalı. Öyle mi çalışıyor kontrol et.
        const { to_kind, amount, currency, from_scope } = transferData;

        // Zorunlu alanlar kontrolü
        if (!to_kind || !amount || !currency || !from_scope) {
            throw {
                status: 400,
                message: t('transfers.create.missingFields')
            };
        }

        // from_scope validasyonu
        if (from_scope !== 'user' && from_scope !== 'company') {
            throw {
                status: 400,
                message: t('transfers.create.invalidFromScope')
            };
        }

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

        // Transaction başlat
        await queryAsync('START TRANSACTION');

        try {
            // Bakiye kontrolü ve güncelleme işlemleri
            await processBalanceTransactions(processedTransferData, userId, companyId);

            // Transfer kaydını veritabanına ekle
            await insertTransferToDatabase(processedTransferData);

            // Transaction'ı commit et
            await queryAsync('COMMIT');

            return {
                status: 'success',
                message: t('transfers.create.success'),
                transfer: {
                    id: transferId,
                    to_kind: processedTransferData.to_kind,
                    amount: processedTransferData.amount,
                    currency: processedTransferData.currency,
                    description: processedTransferData.description
                }
            };
        } catch (error) {
            // Hata durumunda rollback yap
            await queryAsync('ROLLBACK');
            throw error;
        }
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

    // Transfer tipleri (to_kind):
    // 'user_same_company'  - Aynı firmadaki kullanıcıya transfer
    // 'user_other_company' - Farklı firmadaki kullanıcıya transfer
    // 'external'           - Sistemde hesabı olmayan kişiye ödeme
    // 'expense'            - Firma gideri ödemesi
    // 'incoming_manual'    - Sistemde olmayan birinden gelen para kaydı

    // Eğer from_scope 'company' ise, firma hesabından para çıkışı yetkisi kontrol et
    if (transferData.from_scope === 'company') {
        const hasCompanyWithdrawPermission = await checkUserRoles(userId, companyId, ['can_withdraw_from_company']);
        if (!hasCompanyWithdrawPermission) {
            return false;
        }
    }

    switch (transferData.to_kind) {
        case 'user_same_company':
            // Aynı firma içi transfer yetkisi
            return await checkUserRoles(userId, companyId, ['can_transfer_internal']);

        case 'user_other_company':
            // Farklı firmaya transfer yetkisi
            return await checkUserRoles(userId, companyId, ['can_transfer_external']);

        case 'external':
            // Harici kişiye transfer kaydı yetkisi
            return await checkUserRoles(userId, companyId, ['can_transfer_external']);

        case 'expense':
            // Gider kaydı yetkisi
            return await checkUserRoles(userId, companyId, ['can_record_expense']);

        case 'incoming_manual':
            // Gelen para kaydı yetkisi
            return await checkUserRoles(userId, companyId, ['can_record_income']);

        default:
            return false;
    }
};

const prepareTransferData = async (transferData, transferId, userId, companyId) => {
    const {
        to_kind,
        amount,
        currency,
        description,
        to_user_id,
        to_user_company_id,
        from_scope,
        to_external_name,
        to_expense_name
    } = transferData;

    // Transfer tipine göre validasyon
    await validateTransferData(to_kind, transferData, userId, companyId);

    return {
        id: transferId,
        from_scope: from_scope,
        from_user_id: userId,
        company_id: companyId,
        to_kind: to_kind,
        amount: parseFloat(amount),
        currency: currency.toUpperCase(),
        description: description || null,
        to_user_id: to_user_id || null,
        to_user_company_id: to_user_company_id || null,
        to_external_name: to_external_name || null,
        to_expense_name: to_expense_name || null,
        status: 'completed', // completed, pending, cancelled TODO: İlerde alan kişi tarafından onay beklenebilir.
        created_at: new Date()
    };
};

const validateTransferData = async (to_kind, transferData, userId, companyId) => {
    const { to_user_id, to_user_company_id, to_external_name, to_expense_name } = transferData;

    switch (to_kind) {
        case 'user_same_company':
            // Aynı firma içi transfer - to_user_id gerekli
            if (!to_user_id) {
                throw {
                    status: 400,
                    message: t('transfers.create.userSameCompanyRequiresUser')
                };
            }

            // Kullanıcı kendisine para gönderemez
            if (to_user_id === userId) {
                throw {
                    status: 400,
                    message: t('transfers.create.cannotTransferToSelf')
                };
            }

            // Kullanıcının aynı firmada olduğunu kontrol et
            await validateUserInCompany(to_user_id, companyId);

            break;

        case 'user_other_company':
            // Farklı firmadaki kullanıcıya transfer - to_user_id ve to_user_company_id gerekli
            if (!to_user_id || !to_user_company_id) {
                throw {
                    status: 400,
                    message: t('transfers.create.userOtherCompanyRequiresUserAndCompany')
                };
            }

            // Kullanıcının var olduğunu kontrol et
            await validateUserExists(to_user_id);

            // Kullanıcının belirtilen firmada olduğunu kontrol et
            await validateUserInCompany(to_user_id, to_user_company_id);
            break;

        case 'external':
            // Harici kişiye transfer - to_external_name gerekli
            if (!to_external_name) {
                throw {
                    status: 400,
                    message: t('transfers.create.externalRequiresName')
                };
            }
            break;

        case 'expense':
            // Gider kaydı - to_expense_name gerekli
            if (!to_expense_name) {
                throw {
                    status: 400,
                    message: t('transfers.create.expenseRequiresName')
                };
            }
            break;

        case 'incoming_manual':
            // Sistemde olmayan birinden gelen para kaydı - to_external_name gerekli
            if (!to_external_name) {
                throw {
                    status: 400,
                    message: t('transfers.create.incomingManualRequiresName')
                };
            }
            break;

        default:
            throw {
                status: 400,
                message: t('transfers.create.invalidToKind')
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

const processBalanceTransactions = async (transferData, userId, companyId) => {
    const { from_scope, to_kind, amount, currency, to_user_id, to_user_company_id } = transferData;

    // incoming_manual tipinde sadece para girişi var, çıkış yok
    if (to_kind === 'incoming_manual') {
        if (from_scope === 'user') {
            // Kullanıcının hesabına para girişi
            await depositToUserAccount(userId, companyId, amount, currency);
        } else if (from_scope === 'company') {
            // Firma hesabına para girişi
            await depositToCompanyAccount(companyId, amount, currency);
        }
        return; // incoming_manual için başka işlem yapılmaz
    }

    // Para çıkışı işlemi (diğer tipler için)
    if (from_scope === 'user') {
        // Kullanıcının hesabından para çıkışı
        await withdrawFromUserAccount(userId, companyId, amount, currency);
    } else if (from_scope === 'company') {
        // Firma hesabından para çıkışı
        await withdrawFromCompanyAccount(companyId, amount, currency);
    }

    // Para girişi işlemi
    if (to_kind === 'user_same_company' && to_user_id) {
        // Aynı firmadaki kullanıcıya para aktarımı
        await depositToUserAccount(to_user_id, companyId, amount, currency);
    } else if (to_kind === 'user_other_company' && to_user_id && to_user_company_id) {
        // Farklı firmadaki kullanıcıya para aktarımı
        await depositToUserAccount(to_user_id, to_user_company_id, amount, currency);
    }
    // external ve expense tiplerinde para sadece çıkış yapar, giriş kaydedilmez
};

const withdrawFromUserAccount = async (userId, companyId, amount, currency) => {
    // Kullanıcının hesap bakiyesini kontrol et
    const checkBalanceSql = `
        SELECT balance FROM user_accounts 
        WHERE user_id = ? AND company_id = ? AND currency = ?
    `;

    const accounts = await queryAsync(checkBalanceSql, [userId, companyId, currency]);

    if (!accounts || accounts.length === 0) {
        throw {
            status: 400,
            message: t('transfers.create.accountNotFound')
        };
    }

    const currentBalance = parseFloat(accounts[0].balance);
    if (currentBalance < amount) {
        throw {
            status: 400,
            message: t('transfers.create.insufficientBalance')
        };
    }

    // Bakiyeyi güncelle
    const updateBalanceSql = `
        UPDATE user_accounts 
        SET balance = balance - ? 
        WHERE user_id = ? AND company_id = ? AND currency = ?
    `;

    await queryAsync(updateBalanceSql, [amount, userId, companyId, currency]);
};

const withdrawFromCompanyAccount = async (companyId, amount, currency) => {
    // Firma hesap bakiyesini kontrol et
    const checkBalanceSql = `
        SELECT balance FROM companies 
        WHERE id = ? AND currency = ?
    `;

    const companies = await queryAsync(checkBalanceSql, [companyId, currency]);

    if (!companies || companies.length === 0) {
        throw {
            status: 400,
            message: t('transfers.create.companyNotFound')
        };
    }

    const currentBalance = parseFloat(companies[0].balance);
    if (currentBalance < amount) {
        throw {
            status: 400,
            message: t('transfers.create.insufficientCompanyBalance')
        };
    }

    // Bakiyeyi güncelle
    const updateBalanceSql = `
        UPDATE companies 
        SET balance = balance - ? 
        WHERE id = ? AND currency = ?
    `;

    await queryAsync(updateBalanceSql, [amount, companyId, currency]);
};

const depositToUserAccount = async (userId, companyId, amount, currency) => {
    // Kullanıcının hesabına para ekle
    const updateBalanceSql = `
        UPDATE user_accounts 
        SET balance = balance + ? 
        WHERE user_id = ? AND company_id = ? AND currency = ?
    `;

    await queryAsync(updateBalanceSql, [amount, userId, companyId, currency]);
};

const depositToCompanyAccount = async (companyId, amount, currency) => {
    // Firma hesabına para ekle
    const updateBalanceSql = `
        UPDATE companies 
        SET balance = balance + ? 
        WHERE id = ? AND currency = ?
    `;

    await queryAsync(updateBalanceSql, [amount, companyId, currency]);
};

const insertTransferToDatabase = async (transferData) => { // TODO: Bu fonksiyon projenin farklı yerlerinde de kullanılmaktadır. Bu fonksiyonu utils içine taşı.
    const columns = Object.keys(transferData).join(", ");
    const values = Object.values(transferData);
    const placeholders = values.map(() => '?').join(", ");

    const sql = `INSERT INTO transfers (${columns}) VALUES (${placeholders})`;

    await queryAsync(sql, values);
};

module.exports = createTransfer;
