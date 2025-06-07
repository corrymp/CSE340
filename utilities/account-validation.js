const utilities = require('.');
const accountModel = require('../models/accountModel');
const { body, validationResult } = require('express-validator');

const validate = {};

const sanitize = value => body(value).trim().escape().notEmpty();

const emailRules = (existsRule = () => true) => sanitize('account_email').isEmail().normalizeEmail().withMessage('A valid email is required.').custom(existsRule);

const passwordRules = () => body('account_password').trim().notEmpty().isStrongPassword({
    minLength: 12,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
}).withMessage('Password does not meet requirments.');

const firstName = () => sanitize('account_firstname').isLength({ min: 1 }).withMessage('Please provide a first name.');

const lastName = () => sanitize('account_lastname').isLength({ min: 2 }).withMessage('Please provide a last name.');

const emailExists = async account_email => {
    const emailExists = await accountModel.checkExistingEmail(account_email)
    if (emailExists) throw new Error('Email exists. Please use a different email.');
}

validate.updatePasswordRules = () => [passwordRules()];

validate.loginRules = () => [
    emailRules(),
    passwordRules()
];

validate.updateAccountRules = () => [
    firstName(),
    lastName(),
    emailRules()
];

/**
 * @returns {Object[]} sanitization and validation rules to be use
 * @description rules to clean user provided account creation details
 */
validate.registrationRules = () => [
    emailRules(emailExists),
    firstName(),
    lastName(),
    passwordRules()
];

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description validate account creation details fit required parameters
 */
validate.checkRegData = async (req, res, next) => {
    const { account_firstname, account_lastname, account_email } = req.body;
    let errors = validationResult(req);

    if (!errors.isEmpty()) return res.render('account/register', { errors, title: 'Registration', nav: await utilities.getNav(), account_firstname, account_lastname, account_email, lastModified: utilities.lastModified });
    next();
};

validate.checkLoginData = async (req, res, next) => {
    const { account_email } = req.body;
    let errors = validationResult(req);

    if (!errors.isEmpty()) return res.render('account/login', { errors, title: 'Login', nav: await utilities.getNav(), account_email, lastModified: utilities.lastModified });
    next();
};

validate.checkAccountUpdate = async (req, res, next) => {
    const { account_id, account_password, account_firstname, account_lastname, account_email } = req.body;
    let errors = validationResult(req);

    const invalid = async () => {
        res.render('account/update', {
            errors,
            title: 'Update Account',
            nav: await utilities.getNav(),
            account_firstname,
            account_lastname,
            account_email,
            account_password,
            lastModified: utilities.lastModified
        });
    }

    if (account_firstname) {
        const old = await accountModel.getAccountById(account_id);

        if (old.account_firstname === account_firstname && old.account_lastname === account_lastname && old.account_email === account_email) {
            req.flash('notice', 'Nothing was changed');
            console.log(errors);
            return invalid();
        }

        if (old.account_email !== account_email) {
            const exists = await emailExists(account_email);
            console.log(exists);
        }
    }

    if (!errors.isEmpty()) return invalid();

    // verifies the user is editing THEIR account: verifies they are an admin if not
    account_id == res.locals.accountData.account_id
        ? next()
        : utilities.checkAdmin(req, res, next);
}

module.exports = validate;
