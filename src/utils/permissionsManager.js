const permissions = require('../config/permissionsConfig');
const {queryAsync} = require("../database/utils/connection");
const { t } = require('../config/i18nConfig');
const getCompaniesByOwnerId = require('../database/companies/getCompaniesByOwnerId');
const sortAlphabetically = require('./sortAlphabetically');

async function readUserPermissions (userId, companyId = null){
    try {
        let query, params;

        if (companyId) {
            // Belirli bir şirket için yetkileri getir
            query = `SELECT company_id, permissions FROM user_company_permissions WHERE user_id = ? AND company_id = ?`;
            params = [userId, companyId];
        } else {
            // Kullanıcının tüm şirketlerdeki yetkilerini getir
            query = `SELECT company_id, permissions FROM user_company_permissions WHERE user_id = ?`;
            params = [userId];
        }

        // queryAsync kullan
        const results = await queryAsync(query, params);

        // Sonuç kontrolü
        if (!results) {
            if (companyId) {
                throw {
                    status: 404,
                    message: t('permissions.readUser.noPermissionsForCompany')
                };
            }
            // Kullanıcının hiç yetkisi yoksa boş array döndür
            return {
                status: 200,
                message: t('permissions.readUser.noPermissions'),
                permissions: []
            };
        }

        // Her zaman array olarak döndür (tek şirket veya tüm şirketler)
        return {
            status: 200,
            message: t('permissions.readUser.success'),
            permissions: results.map(row => ({
                companyId: row.company_id,
                permissions: row.permissions || ''
            }))
        };

    } catch (error) {
        throw {
            status: error.status || 500,
            message: error.message || t('permissions.readUser.error'),
            error
        };
    }
}

async function setUserPermissions(userId, companyId, permissions) {
    try {
        const sortedPermissions = sortAlphabetically(permissions);

        // Önce kayıt var mı kontrol et
        const checkQuery = `SELECT * FROM user_company_permissions WHERE user_id = ? AND company_id = ?`;
        const existingRecord = await queryAsync(checkQuery, [userId, companyId]);

        let query;
        if (existingRecord && existingRecord.length > 0) {
            // Kayıt varsa güncelle
            query = `UPDATE user_company_permissions SET permissions = ? WHERE user_id = ? AND company_id = ?`;
            await queryAsync(query, [sortedPermissions, userId, companyId]);
        } else {
            // Kayıt yoksa yeni ekle
            query = `INSERT INTO user_company_permissions (user_id, company_id, permissions) VALUES (?, ?, ?)`;
            await queryAsync(query, [userId, companyId, sortedPermissions]);
        }

        return {
            status: true,
            message: t('permissions.setUser.success'),
            companyId: companyId,
            newPermissions: sortedPermissions
        };
    } catch (error) {
        throw {
            status: 500,
            message: t('permissions.setUser.error'),
            error
        };
    }
}

function addUserPermissions(userId, companyId, newPermissions) {
    return new Promise((resolve, reject) => {
        readUserPermissions(userId, companyId)
            .then(response => {
                // Array'den ilk elemanı al (tek şirket sorgusu)
                if (response.permissions.length === 0) {
                    return '';
                }
                return response.permissions[0].permissions;
            })
            .then(userPermissions => {
                for (const permission of newPermissions) {
                    if (permission && userPermissions.indexOf(permission) === -1)
                        userPermissions += permission;
                }
                return userPermissions;
            })
            .then(userNewPermissions => {
                setUserPermissions(userId, companyId, userNewPermissions)
                    .then(data => resolve(data))
                    .catch(error => reject(error))
            })
            .catch(error => reject(error));
    });
}

function removeUserPermissions(userId, companyId, removePermissions) {
    return new Promise((resolve, reject) => {
        readUserPermissions(userId, companyId)
            .then(response => {
                // Array'den ilk elemanı al (tek şirket sorgusu)
                if (response.permissions.length === 0) {
                    return '';
                }
                return response.permissions[0].permissions;
            })
            .then(userPermissions => {
                for (const permission of removePermissions) {
                    if (permission)
                        userPermissions = userPermissions.replaceAll(permission, '');
                }
                return userPermissions;
            })
            .then(userNewPermissions => {
                setUserPermissions(userId, companyId, userNewPermissions)
                    .then(data => resolve(data))
                    .catch(error => reject(error))
            })
            .catch(error => reject(error));
    });
}

function checkRoles(permissionsString) {
    const roles = [];
    for (const key in permissions) {
        if (permissions.hasOwnProperty(key)) {
            if (permissionsString.includes(permissions[key].code)) {
                roles.push(key);
            }
        }
    }

    return roles;
}

async function checkUserRoles(userId, companyId, roles = ['sys_admin'], fullMatch = false) {
    try {
        const data = await readUserPermissions(userId, companyId);

        let userPermissions = '';

        // Belirli bir şirket için - sadece o şirketin yetkilerini kontrol et
        if (Array.isArray(data.permissions) && data.permissions.length > 0) {
            userPermissions = data.permissions[0].permissions || '';
        }

        const userRoles = checkRoles(userPermissions);
        console.log("userRoles :",userRoles);
        if (userRoles.includes('sys_admin'))
            return true;

        if (fullMatch)
            return roles.every(role => userRoles.includes(role));    // roles array'ında bulunan her bir index userRoles array'ında da bulunuyorsa true döner
        else
            return roles.some(role => userRoles.includes(role));    // roles array'ında bulunan her hangi bir index userRoles array'ında da bulunuyorsa true döner

    } catch (error) {
        console.error(t('permissions.checkUserRoles.error', { userId }), error);
    }
}

/**
 * Kullanıcının yeni firma oluşturma hakkını kontrol eder
 * @param {string} userId - Kullanıcı ID
 * @returns {Promise<Object>} Kullanıcının firma oluşturabilme durumu
 */
async function canUserCreateCompany(userId) {
    try {
        if (!userId) {
            throw new Error(t('permissions.canCreateCompany.userIdRequired') || 'Kullanıcı ID gereklidir');
        }

        // Users tablosundan max_companies değerini al
        const userQuery = `SELECT max_companies FROM users WHERE id = ?`;
        const userResults = await queryAsync(userQuery, [userId]);

        if (!userResults || userResults.length === 0) {
            throw {
                status: 404,
                message: t('permissions.canCreateCompany.userNotFound') || 'Kullanıcı bulunamadı'
            };
        }

        const maxCompanies = userResults[0].max_companies || 0;

        // Kullanıcının mevcut firma sayısını al
        const userCompanies = await getCompaniesByOwnerId(userId);
        const currentCompanyCount = userCompanies.length;

        // Karşılaştırma yap
        const canCreate = currentCompanyCount < maxCompanies;

        return {
            status: 200,
            message: canCreate 
                ? t('permissions.canCreateCompany.canCreate') || 'Kullanıcı yeni firma oluşturabilir'
                : t('permissions.canCreateCompany.cannotCreate') || 'Kullanıcı firma oluşturma limitine ulaştı',
            canCreate: canCreate,
            maxCompanies: maxCompanies,
            currentCompanyCount: currentCompanyCount,
            remainingSlots: maxCompanies - currentCompanyCount
        };

    } catch (error) {
        throw {
            status: error.status || 500,
            message: error.message || t('permissions.canCreateCompany.error') || 'Firma oluşturma hakkı kontrolünde hata',
            error
        };
    }
}

/**
 * Kullanıcının diğer kullanıcıları arama yetkisini kontrol eder
 * @param {string} userId - Kullanıcı ID
 * @param {string} companyId - Firma ID
 * @returns {Promise<Object>} Kullanıcının arama yapabilme durumu ve kapsamı
 */
async function canUserSearchUsers(userId, companyId) {
    try {
        if (!userId || !companyId) {
            throw new Error(t('permissions.canSearchUsers.userIdAndCompanyIdRequired') || 'Kullanıcı ID ve Firma ID gereklidir');
        }

        // Kullanıcının firma sahibi olup olmadığını kontrol et
        const ownerQuery = `SELECT id FROM companies WHERE owner_id = ? AND id = ?`;
        const ownerResults = await queryAsync(ownerQuery, [userId, companyId]);
        const isOwner = ownerResults && ownerResults.length > 0;

        // Eğer firma sahibiyse tüm kullanıcılara erişebilir
        if (isOwner) {
            return {
                status: 200,
                message: t('permissions.canSearchUsers.canSearchAll') || 'Tüm kullanıcıları arayabilir',
                canSearch: true,
                searchScope: 'all', // 'all': Tüm kullanıcılar, 'company': Sadece firma içi, 'none': Hiçbiri
                reason: 'owner'
            };
        }

        // Kullanıcının yetkilerini kontrol et (personnel_manager VEYA can_transfer_external)
        const hasSearchAllPermission = await checkUserRoles(userId, companyId, ['personnel_manager', 'can_transfer_external'], false);

        // Personel yöneticisi veya firma dışı para aktarma yetkisi varsa tüm kullanıcılara erişebilir
        if (hasSearchAllPermission) {
            return {
                status: 200,
                message: t('permissions.canSearchUsers.canSearchAll') || 'Tüm kullanıcıları arayabilir',
                canSearch: true,
                searchScope: 'all',
                reason: 'has_search_permission'
            };
        }

        // Yukarıdaki koşullar sağlanmıyorsa sadece kendi firmasındaki kullanıcıları arayabilir
        return {
            status: 200,
            message: t('permissions.canSearchUsers.canSearchCompanyOnly') || 'Sadece firma içi kullanıcıları arayabilir',
            canSearch: true,
            searchScope: 'company',
            reason: 'default'
        };

    } catch (error) {
        throw {
            status: error.status || 500,
            message: error.message || t('permissions.canSearchUsers.error') || 'Kullanıcı arama yetkisi kontrolünde hata',
            error
        };
    }
}

module.exports = {readUserPermissions, checkUserRoles, addUserPermissions, removeUserPermissions, canUserCreateCompany, canUserSearchUsers};
