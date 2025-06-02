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
}

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
}

module.exports = { registerAccount, checkExistingEmail, getAccountByEmail };
