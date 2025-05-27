const utilities = require('../utilities');
const accountModel = require('../models/accountModel');

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description build login view
 */
const buildLogin = async (req, res, next) => res.render('account/login', { title: 'Login', nav: await utilities.getNav(), errors: null });

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description build register view
 */
const buildRegister = async (req, res, next) => res.render('account/register', { title: 'Register', nav: await utilities.getNav(), errors: null });

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @description build view post registration. If pass: login; else: register
 */
const registerAccount = async (req, res) => {
    const { account_firstname, account_lastname, account_email, account_password } = req.body;

    const regResult = await accountModel.registerAccount(account_firstname, account_lastname, account_email, account_password);

    const [msg, status, dest, title] = regResult
        ? [`You are now registered, ${account_firstname}! Please log in.`, 201, 'login', 'Login']
        : ['Registration failed.', 501, 'register', 'Register'];

    req.flash('notice', msg);

    res.status(status).render(`account/${dest}`, { title, nav: await utilities.getNav(), errors: null });
};

module.exports = { buildLogin, buildRegister, registerAccount };
