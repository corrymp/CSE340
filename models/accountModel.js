const pool = require('../database');

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
            [account_firstname, account_lastname, account_email, account_password]
        );
    }
    catch (e) {
        return e.message;
    }
};

module.exports = { registerAccount };
