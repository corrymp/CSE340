const pool = require('../database');
const verbose = true;

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
            verbose
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
            verbose
        );
        return email.rowCount;
    }
    catch (e) {
        return error.message;
    }
}

const checkAccount = async (account_email, account_password) => {
    try {
        const account = await pool.query(
            `SELECT * 
                FROM account
                WHERE account_email = $1
                AND account_password = $2`,
            [account_email, account_password],
            verbose
        );

        if(account.rows[0]) return account.rows[0];
        return false;
    }
    catch (e) {
        return error.message;
    }
}

module.exports = { registerAccount, checkExistingEmail, checkAccount };
