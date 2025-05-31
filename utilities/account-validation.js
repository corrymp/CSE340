const utilities = require('.');
const accountModel = require('../models/accountModel');
const { body, validationResult } = require('express-validator');

const validate = {};
const sanitize = value => body(value).trim().escape().notEmpty();
const emailRules = account_email => sanitize(account_email).isEmail().normalizeEmail().withMessage('A valid email is required.');
const passwordRules = account_password => body(account_password).trim().notEmpty()

/**
 * @returns {Object[]} sanitization and validation rules to be use
 * @description rules to clean user provided account creation details
 */
validate.registrationRules = () => [
    sanitize('account_firstname').isLength({ min: 1 }).withMessage('Please provide a first name.'),
    sanitize('account_lastname').isLength({ min: 2 }).withMessage('Please provide a last name.'),
    emailRules('account_email').custom(async account_email => {
        const emailExists = await accountModel.checkExistingEmail(account_email)
        if (emailExists) throw new Error('Email exists. Please log in or use a different email.');
    }),
    passwordRules('account_password').isStrongPassword({
        minLength: 12,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    }).withMessage('Password does not meet requirments.')
];

validate.loginRules = () => [
    emailRules('account_email'),
    passwordRules('account_password')
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

module.exports = validate;
