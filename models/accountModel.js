const pool = require('../database');
const verbose = false;
const extraDetails = false;

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
            [account_firstname, account_lastname, account_email, account_password],
            verbose, extraDetails
        );
    }
    catch (e) {
        return e.message;
    }
};

const checkExistingEmail = async account_email => {
    try {
        const email = await pool.query(
            `SELECT * 
                FROM account
                WHERE account_email = $1`,
            [account_email],
            verbose, extraDetails
        );
        return email.rowCount;
    }
    catch (e) {
        return error.message;
    }
};

const getAccountByEmail = async account_email => {
    try {
        const result = await pool.query(
            `SELECT 
                    account_id, 
                    account_firstname, 
                    account_lastname, 
                    account_email,
                    account_type,
                    account_password
                FROM account
                WHERE account_email = $1`,
            [account_email],
            verbose, extraDetails
        );
        return result.rows[0];
    }
    catch (e) {
        return new Error('No matching email found');
    }
};

const getAccountById = async account_id => {
    try {
        const result = await pool.query(
            `SELECT 
                    account_id, 
                    account_firstname, 
                    account_lastname, 
                    account_email,
                    account_type,
                    account_password
                FROM account
                WHERE account_id = $1`,
            [account_id],
            verbose, extraDetails
        );
        return result.rows[0];
    }
    catch (e) {
        return new Error('No account found');
    }
};

const updateAccount = async (account_id, account_email, account_firstname, account_lastname) => {
    try {
        return await pool.query(
            `UPDATE account
                SET account_email = $2,
                    account_firstname = $3,
                    account_lastname = $4
                WHERE account_id = $1
                RETURNING *`,
            [account_id, account_email, account_firstname, account_lastname],
            verbose, extraDetails
        );
    } 
    catch (e) {
        return error.message;
    }
}

const updatePW = async (account_id, account_password) => {
    try {
        return await pool.query(
            `UPDATE account
                SET account_password = $2
                WHERE account_id = $1
                RETURNING *`,
            [account_id, account_password],
            verbose, extraDetails
        );
    } 
    catch (e) {
        return error.message;
    }
}

module.exports = { registerAccount, checkExistingEmail, getAccountByEmail, getAccountById, updateAccount, updatePW };
