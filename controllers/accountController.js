//#region dependencies
const utilities = require('../utilities');
const accountModel = require('../models/accountModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
//#endregion dependencies

//#region register
/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description build register view
 */
const buildRegister = async (req, res) => res.render('account/register', {
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

//#endregion register

//#region login
/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description build login view
 */
const buildLogin = async (req, res) => res.render('account/login', {
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

    try {
        if (accountData && await bcrypt.compare(account_password, accountData.account_password)) return grantJWTToken(res, accountData, ()=>res.redirect('/account/'));

        invalidLogin();
    }
    catch (e) {
        throw new Error('Access Forbidden');
    }
};
//#endregion login

//#region update
/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @description build update view
 */
const buildAccountUpdate = async (req, res) => res.render('account/update', {
    title: 'Update Account',
    nav: await utilities.getNav(),
    errors: null,
    account_id: res.locals.account_id ?? res.locals.accountData.account_id,
    account_email: res.locals.account_email ?? res.locals.accountData.account_email,
    account_firstname: res.locals.account_firstname ?? res.locals.accountData.account_firstname,
    account_lastname: res.locals.account_lastname ?? res.locals.accountData.account_lastname,
    lastModified: utilities.lastModified
});

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {"user"|"password"} type - type of update to perform
 * @description handle updates to user accounts
 */
const updateAccount = async (req, res, type) => {
    if (!['user', 'password'].includes(type)) { req.flash('notice', 'Unknown update type'); return buildAccountUpdate(req, res); }

    const { account_id, account_firstname, account_lastname, account_email, account_password } = req.body;

    let updateRes;

    try {

        updateRes = type === 'user'
            ? await accountModel.updateAccount(account_id, account_email, account_firstname, account_lastname)
            : await accountModel.updatePW(account_id, await bcrypt.hashSync(account_password, 10));
        
        grantJWTToken(res, updateRes.rows[0], () => {
            req.flash('notice', `${type === 'user' ? 'Account information' : 'Password'} updated.`);
            res.status(201).redirect('/account/');
        }, res.locals.accountData.exp - Math.floor(Date.now() / 1000));
    }
    catch (e) {
        res.status(501);
        req.flash('notice', `Sorry, there was an issue updating your ${type === 'user' ? 'information' : 'password'}.`);
        buildAccountUpdate(req, res);
    }
};

//#endregion update

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @description build management view
 */
const buildManagement = async (req, res) => res.render('account/logged-in', {
    title: 'Logged In',
    nav: await utilities.getNav(),
    errors: null,
    lastModified: utilities.lastModified
});

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @description logs user out of account and sends them home
 */
const accountLogout = async (req, res) => {
    if (res.locals.loggedin) req.flash('notice', 'You have been logged out.');
    res.locals.loggedin = 0;
    res.clearCookie('jwt');
    res.redirect(
        //req.header('Referrer')
        '/' // I would rather send them to the page they were on, but the instructions say to send them home...
    );
};

/**
 * @param {Response} res - Express response object
 * @param {Object} accountData - Data of account
 * @param {Function} cb - callback function
 * @param {Number} duration - time till cookie expires
 * @description issue new JsonWebToken
 */
const grantJWTToken = (res, accountData, cb, duration = 3600000) => {
    if (accountData.account_password) delete accountData.account_password;

    res.cookie('jwt',
        jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: duration }),
        { httpOnly: true, maxAge: duration, secure: process.env.NODE_ENV !== 'development' }
    );

    if(cb) cb();
};

module.exports = { 
    buildLogin,         accountLogin, 
    buildRegister,      registerAccount, 
    buildAccountUpdate, updateAccount,
    buildManagement,  
    accountLogout
};
