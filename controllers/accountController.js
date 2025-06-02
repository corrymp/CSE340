const utilities = require('../utilities');
const accountModel = require('../models/accountModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

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
const accountLogin = async (req, res) => {
    const { account_email, account_password } = req.body;

    const accountData = await accountModel.getAccountByEmail(account_email);

    const invalidLogin = async () => {
        req.flash('notice', 'Please check your credentials and try again.');
        res.status(400).render('account/login', {
            title: 'Login',
            nav: await utilities.getNav(),
            errors: null,
            account_email,
            lastModified: utilities.lastModified
        });
    }

    if (!accountData) return invalidLogin();

    try {
        if (await bcrypt.compare(account_password, accountData.account_password)) {
            delete accountData.account_password;
            const accessToken = jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600000 });
            res.cookie('jwt', accessToken, { httpOnly: true, maxAge: 3600000, secure: process.env.NODE_ENV === 'development' ? false : true });

            return res.redirect('/account/');
        }
        else invalidLogin();
    }
    catch (e) {
        throw new Error('Access Forbidden');
    }
};

const accountManagement = async (req, res) => res.render('account/logged-in', {
    title: 'Logged In',
    nav: await utilities.getNav(),
    errors: null,
    lastModified: utilities.lastModified
});

module.exports = { buildLogin, buildRegister, registerAccount, accountLogin, accountManagement };
