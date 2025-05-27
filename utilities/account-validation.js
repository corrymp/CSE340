const utilities = require('.');
const { body, validationResult } = require('express-validator');

const validate = {};
const sanitize = value => body(value).trim().escape().notEmpty()

/**
 * @returns {Object[]} sanitization and validation rules to be use
 * @description rules to clean user provided account creation details
 */
validate.registrationRules = () => [
    sanitize('account_firstname').isLength({ min: 1 }).withMessage('Please provide a first name.'),
    sanitize('account_lastname').isLength({ min: 2 }).withMessage('Please provide a last name.'),
    sanitize('account_email').isEmail().normalizeEmail().withMessage('A valid email is required.'),
    body('account_password').trim().notEmpty().isStrongPassword({
        minLength: 12,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    }).withMessage('Password does not meet requirments.')
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

    if (!errors.isEmpty()) return res.render('account/register', { errors, title: 'Registration', nav: await utilities.getNav(), account_firstname, account_lastname, account_email });

    next();
};

module.exports = validate;
