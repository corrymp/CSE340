const utilities = require('../utilities');
const accountModel = require('../models/accountModel');
const bcrypt = require('bcryptjs');

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description build register view
 */
const buildRegister = async (req, res, next) => res.render('account/register', { 
    title: 'Register', 
    nav: await utilities.getNav(), 
    errors: null, 
    lastModified: utilities.lastModified 
});

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @description build view post registration. If pass: login; else: register
 */
const registerAccount = async (req, res) => {
    const { account_firstname, account_lastname, account_email, account_password } = req.body;
    let hashedPassword, regResult;

    try {
        hashedPassword = await bcrypt.hashSync(account_password, 10);
        regResult = await accountModel.registerAccount(account_firstname, account_lastname, account_email, hashedPassword);
    }
    catch (e) {
        regResult = false; // just to be sure :shrug:
    }

    const [msg, status, dest, title] = hashedPassword ? regResult
        ? [`You are now registered, ${account_firstname}! Please log in.`, 201, 'login', 'Login']
        : ['Registration failed.', 501, 'register', 'Register']
        : ['Sorry, there was an error processing your registration.', 500, 'register', 'Register']

    req.flash('notice', msg);
    
    res.status(status).render(`account/${dest}`, { 
        title, 
        nav: await utilities.getNav(), 
        errors: null, 
        lastModified: utilities.lastModified
    });
};

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description build login view
 */
const buildLogin = async (req, res, next) => res.render('account/login', { 
    title: 'Login', 
    nav: await utilities.getNav(), 
    errors: null, 
    lastModified: utilities.lastModified 
});

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @description build view post login. If pass: home; else: login
 */
const loginAccount = async (req, res) => {
    const { account_email, account_password } = req.body;
    const loginRes = await accountModel.checkAccount(account_email, account_password);

    const [msg, status, dest, title] = loginRes
        ? [`You are now logged in, ${loginRes.account_firstname}!`, 201, 'index', 'Home']
        : ['Email or password is incorrect. We are letting you in anyway because we feel like it.', 501, 'index', 'Home'];

    req.flash('notice', msg);

    res.status(status).render(dest, { title, nav: await utilities.getNav(), errors: null, lastModified: utilities.lastModified });
};

module.exports = { buildLogin, buildRegister, registerAccount, loginAccount };
