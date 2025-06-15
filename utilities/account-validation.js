//#region dependencies
const utilities = require('.');
const accountModel = require('../models/accountModel');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
//#endregion dependencies

const validate = {};

//#region individual rules

/**
 * @param {String|Number} value - form input to sanitize
 * @returns validation results
 */
const sanitize = value => body(value).trim().escape().notEmpty();

/**
 * @param {String} account_email - email to check for the existence of
 * @param {Boolean|'shrug'} shouldExist - whether or not the email should exist in the account table. 'shrug' equates to the email litteraly existing as a string
 * @returns {Void|Error|true}
 *  - should   be   a   truthy   value  and is      : true
 *  - should   be   a   truthy   value  and is   not: Error "No email provided."
 *  - should     exist in account table and does    : Void
 *  - should     exist in account table and does not: Error "Email not registered with any accounts."
 *  - should not exist in account table and does    : Error "Email exists. Please use a different email."
 *  - should not exist in account table and does not: Void
 */
const emailExists = async (account_email, shouldExist, req) => {
    console.log('starting check');
    if (!account_email) throw new Error('No email provided.');
    if (shouldExist === 'shrug') return true;

    let _shouldExist = shouldExist;

    if (shouldExist === 'passIfSame') {
        try {
            console.log('Getting body from request...');
            const body = req.body;
            console.log('Got body from request:\n', body);

            console.log('Getting ID from body...');
            const { account_id } = req.body;
            console.log('Got ID from body:' + account_id);

            console.log('Getting account with ID...');
            const account = await accountModel.getAccountById(account_id);
            console.log('Got account with ID:\n', account_id);

            console.log('Getting email from account...');
            const current_email = account.account_email;
            console.log('Got email from account:' + current_email);

            if (account_email === current_email) {
                console.log('can match, does match');
                return true;
            }
            console.log('can match, does not match');
        }
        catch (e) { console.error('error getting current email:' + e.message); }
        _shouldExist = false;
    }

    const emailExists = await accountModel.checkExistingEmail(account_email);

    if (_shouldExist && emailExists === 0) { console.log('should exist, does not exist'); throw new Error('Email not registered with any accounts.'); }
    if (_shouldExist && emailExists !== 0) { console.log('should exist, does exist'); return true; }

    if (!_shouldExist && emailExists !== 0) { console.log('should not exist, does exist'); throw new Error('Email exists. Please use a different email.'); }
    if (!_shouldExist && emailExists === 0) { console.log('should not exist, does not exist'); return true; }
};

const emailNotUsedByOthers = req => sanitize('account_email').custom(v => emailExists(v, 'passIfSame', req));
const emailNotUsed = req => sanitize('account_email').custom(v => emailExists(v, true, req));

/**
 * @returns validation results
 * @description sanitizes and validates password form input; checks that it meets password requirments
 */
const _passwordRules = v => v.trim().notEmpty().isStrongPassword({ minLength: 12, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 }).withMessage('Password does not meet requirments.');
const optionalPasswordRules = () => _passwordRules(body('account_password').optional());
const passwordRules = () => _passwordRules(body('account_password'));

/**
 * @returns validation results
 * @description sanitizes and validates firdt name form input; checks at least 1 char is present
 */
const firstName = () => sanitize('account_firstname').isLength({ min: 1 }).withMessage('Please provide a first name.');

/**
 * @returns validation results
 * @description sanitizes and validates last name form input; checks at least 2 chars present
 */
const lastName = () => sanitize('account_lastname').isLength({ min: 2 }).withMessage('Please provide a last name.');

/**
 * @returns validation results
 * @description sanitizes and validates account type form input; checks that it is in the list of valid types
 */
const accountTypeRules = () => sanitize('account_type').custom(value => ['Admin', 'Employee', 'Client'].includes(value)).withMessage('Invalid account type.');

//#endregion individual rules

//#region rule collections

/**
 * @returns {Object[]} array of rules
 * @description rules to use when validating password update requests
 */
validate.updatePasswordRules = () => [passwordRules()];

/**
 * @returns {Object[]} array of rules
 * @description rules to use when validating login requests
 */
validate.loginRules = () => [emailNotUsed(), passwordRules()];

/**
 * @returns {Object[]} array of rules
 * @description rules to use when validating account info update requests
 */
validate.updateAccountRules = () => [emailNotUsedByOthers(), firstName(), lastName()];

/**
 * @returns {Object[]} array of rules
 * @description rules to use when validating account registration requests
 */
validate.registrationRules = () => [emailNotUsed(), firstName(), lastName(), passwordRules()];

/**
 * @returns {Object[]} array of rules
 * @description rules to use when validating account management edit requests
 */
validate.managementAccountEditRules = () => [emailNotUsedByOthers(), accountTypeRules(), firstName(), lastName(), optionalPasswordRules()];

//#endregion rule collections

//#region validators

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description validates registration requests; pass: call next function; else: return to registration view
 */
validate.validateRegistrationRequest = async (req, res, next) => {
    let errors = validationResult(req);
    const { account_firstname, account_lastname, account_email } = req.body;
    if (!errors.isEmpty()) return res.status(400).render('account/register', { errors, title: 'Registration', nav: await utilities.getNav(), account_firstname, account_lastname, account_email, lastModified: utilities.lastModified });
    next();
};

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description validates login requests; pass: call next function; else: return to login view
 */
validate.validateLoginRequest = async (req, res, next) => {
    console.log('starting request validation')
    let errors = validationResult(req);
    console.log('request validation complete')
    const { account_email } = req.body;
    if (!errors.isEmpty()) return res.status(400).render('account/login', { errors, title: 'Login', nav: await utilities.getNav(), account_email, lastModified: utilities.lastModified });
    next();
};

const detailsChanged = (old, new_firstname, new_lastname, new_email, new_type) => (old.account_firstname === new_firstname && old.account_lastname === new_lastname && old.account_email === new_email && old.account_type === new_type) ? false : true;

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description validates account update requests; pass: calls next function; else: returns to edit view
 */
validate.validateAccountUpdateRequest = async (req, res, next) => {
    const invalid = async (errors) => res.status(400).render('account/update', { title: 'Update Account', errors, nav: await utilities.getNav(), account_firstname, account_lastname, account_email, lastModified: utilities.lastModified });

    let errors = validationResult(req);

    const { account_id, account_firstname, account_lastname, account_email } = req.body;

    const old = await accountModel.getAccountById(account_id);

    if (!detailsChanged(old, account_firstname, account_lastname, account_email)) {
        req.flash('notice', 'Nothing was changed');
        return invalid(null);
    }

    if (!errors.isEmpty()) return invalid(errors);

    // verifies the user is editing THEIR account: verifies they are an admin if not
    account_id == res.locals.accountData.account_id ? next() : utilities.checkAdmin(req, res, next);
}

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description validates password update requests; pass: calls next function; else: returns to edit view
 */
validate.validatePasswordUpdateRequest = async (req, res, next) => {
    const invalid = async () => res.status(400).redirect('account/update');

    let errors = validationResult(req);

    const { account_id, account_password } = req.body;

    const old_account_password = (await accountModel.getAccountById(account_id)).account_password;

    if (bcrypt.compareSync(account_password, old_account_password)) { req.flash('notice', 'The new password must not be the same as the old password.'); return invalid(); }

    if (!errors.isEmpty()) return invalid();

    // verifies the user is editing THEIR account: verifies they are an admin if not
    account_id == res.locals.accountData.account_id ? next() : utilities.checkAdmin(req, res, next);
}

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description validates account update requests; pass: calls next function; else: returns to edit view
 */
validate.validateManagementAccountEditRequest = async (req, res, next) => {
    const invalid = async (errors) => res.status(400).render(`./account/manage/edit`, { title: `Edit ${account_firstname} ${account_lastname}`, nav: await utilities.getNav(), accountTypeSelect: await utilities.buildAccountTypeList(false, account_type), errors, account_id, account_email, account_firstname, account_lastname, lastModified: utilities.lastModified });

    let errors = validationResult(req);

    const { account_id, account_firstname, account_lastname, account_email, account_type } = req.body;

    const old = await accountModel.getAccountById(account_id);

    // verifies that changes occured
    if (!detailsChanged(old, account_firstname, account_lastname, account_email, account_type)) {
        req.flash('notice', 'Nothing was changed');
        return invalid(null);
    }

    // ignores errors that relate to the password field being empty - the user may not want to change it, so don't force it
    for (let i = 0; i < errors.errors.length; i++) {
        const error = errors.errors[i];
        if (error.path === 'account_password' && error.value === '') delete errors.errors[i];
        if (error.path === 'account_email' && error.value === old.account_email) delete errors.errors[i];
    }

    if (!errors.isEmpty() && errors.errors.flat().length) return invalid(errors);

    next();
}
//#endregion validators

module.exports = validate;
