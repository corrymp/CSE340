//#region dependencies
const pool = require('../database');
//#endregion dependencies

const verbose = false;
const extraDetails = false;

/**
 * @param {String} account_email - users email address
 * @returns {Object[]} resulting row count from SQL query
 * @description checks if a given email is already in the account table
 */
const checkExistingEmail = async account_email => {
    try {
        return (await pool.query(
            `SELECT * 
                FROM account
                WHERE account_email = $1`,
            [account_email], verbose, extraDetails
        )).rowCount;
    }
    catch (e) { return error.message; }
};

/**
 * @param {String} account_firstname - users first name
 * @param {String} account_lastname - users last name
 * @param {String} account_email - users email address
 * @param {String} account_password - users account password
 * @returns {Object[]} resulting data from SQL query
 * @description registers a new user by creating their row in the accounts database
 */
const registerAccount = async (account_firstname, account_lastname, account_email, account_password) => {
    try {
        return await pool.query(
            `INSERT
                INTO account (
                    account_firstname, 
                    account_lastname, 
                    account_email, 
                    account_password
                )
                VALUES ( $1, $2, $3, $4 )
                RETURNING *`,
            [account_firstname, account_lastname, account_email, account_password], verbose, extraDetails
        );
    }
    catch (e) { return e.message; }
};

//#region get
/**
 * @param {String} account_email - users email address
 * @returns {Object} first row returned from SQL query
 * @description gets user data from a given email
 */
const getAccountByEmail = async account_email => {
    try {
        return (await pool.query(
            `SELECT 
                    account_id, 
                    account_firstname, 
                    account_lastname, 
                    account_email,
                    account_type,
                    account_password
                FROM account
                WHERE account_email = $1`,
            [account_email], verbose, extraDetails
        )).rows[0];
    }
    catch (e) { return new Error('No matching email found'); }
};

/**
 * @param {Number} account_id - user account id: account table primary key
 * @returns {Object} first row returned from SQL query
 * @description gets user data from a given account id
 */
const getAccountById = async account_id => {
    try {
        return await (await pool.query(
            `SELECT 
                    account_id, 
                    account_firstname, 
                    account_lastname, 
                    account_email,
                    account_type,
                    account_password
                FROM account
                WHERE account_id = $1`,
            [account_id], verbose, extraDetails
        )).rows[0];
    }
    catch (e) { return new Error('No account found'); }
};

/**
 * @param {String} account_type - user account type; 'All' returns all accounts
 * @returns {Object} rows returned from SQL query
 * @description gets all account table rows of a given type
 */
const getAllAccountsByType = async account_type => {
    try {
        return (await pool.query(
            `SELECT
                    account_id,
                    account_firstname,
                    account_lastname,
                    account_email,
                    account_type
                FROM account
                ${account_type === 'All'
                ? 'ORDER BY account_type'
                : 'WHERE account_type = $1'
            }`,
            ...(account_type === 'All' 
                ? [[], verbose, extraDetails] 
                : [[account_type], verbose, extraDetails]
            )
        )).rows;
    }
    catch (e) { console.error('getAllAccountsByType error: ' + e); }
}
//#endregion get

//#region update

/**
 * @param {Number} account_id           - user account id: account table primary key
 * @param {String} account_firstname    - users first name
 * @param {String} account_lastname     - users last name
 * @param {String} account_email        - users email address
 * @param {String} account_password     - users hashed account password
 * @returns {Object} resulting data from SQL query
 * @description updates an existing row in the account database
 */
const updateAcountById = async (account_id, account_email, account_firstname, account_lastname, account_password, account_type) => {
    try {
        return await pool.query(
            `UPDATE account
                SET account_email       = $2,
                    account_firstname   = $3,
                    account_lastname    = $4,
                    account_password    = $5${account_type ? `,
                    account_type        = $6` : ''}
                WHERE account_id        = $1
                RETURNING *`,
            [account_id, account_email, account_firstname, account_lastname, account_password, ...(account_type ? [account_type] : [])], verbose, extraDetails
        );
    }
    catch (e) { return e.message; }
}

/**
 * @param {String} account_id           - user account id: account table primary key
 * @param {String} account_firstname    - users first name
 * @param {String} account_lastname     - users last name
 * @param {String} account_email        - users email address
 * @returns {Object} resulting data from SQL query
 * @description updates an existing row in the account database
 */
const updateAccountDetailsById = async (account_id, account_email, account_firstname, account_lastname, account_type) => {
    try {
        return await pool.query(
            `UPDATE account
                SET account_email       = $2,
                    account_firstname   = $3,
                    account_lastname    = $4${account_type ? `,
                    account_type        = $5` : ''}
                WHERE account_id        = $1
                RETURNING *`,
            [account_id, account_email, account_firstname, account_lastname, ...(account_type ? [account_type] : [])], verbose, extraDetails
        );
    }
    catch (e) { return e.message; }
}

/**
 * @param {Number} account_id           - user account id: account table primary key
 * @param {String} account_password     - users hashed account password
 * @returns {Object} resulting data from SQL query
 * @description updates an existing row in the account table
 */
const updateAccountPasswordById = async (account_id, account_password) => {
    try {
        return await pool.query(
            `UPDATE account
                SET account_password    = $2
                WHERE account_id        = $1
                RETURNING *`,
            [account_id, account_password], verbose, extraDetails
        );
    }
    catch (e) { return error.message; }
}
//#endregion update

//#region delete
/**
 * @param {number} account_id - user account id: account table primary key
 * @returns results of SQL query
 * @description deletes account table row with primary key
 */
const deleteAccountById = async account_id => {
    try {
        return await pool.query(
            `DELETE
                FROM account
                WHERE account_id = $1`,
            [account_id], verbose, extraDetails
        );
    }
    catch (e) { console.error('Account deletion error: ' + e); }
}
//#endregion delete

module.exports = {
    registerAccount,
    checkExistingEmail,
    getAccountByEmail,
    getAccountById,
    getAllAccountsByType,
    updateAcountById,
    updateAccountDetailsById,
    updateAccountPasswordById,
    deleteAccountById
};
