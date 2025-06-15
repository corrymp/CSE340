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
const registrationView = async (req, res) => res.render('account/register', { title: 'Register', nav: await utilities.getNav(), errors: null, lastModified: utilities.lastModified });

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @description build view post registration. If pass: login; else: register
 */
const registrationHandler = async (req, res) => {
    const { account_firstname, account_lastname, account_email, account_password } = req.body;
    let hashedPassword, regResult;
    try {
        hashedPassword = await bcrypt.hashSync(account_password, 10);
        regResult = await accountModel.registerAccount(account_firstname, account_lastname, account_email, hashedPassword);
    }
    catch (e) { regResult = false; } // just to be sure :shrug:
    const [msg, status, dest, title] = hashedPassword ? regResult
        ? [`You are now registered, ${account_firstname}! Please log in.`, 201, 'login', 'Login']
        : ['Registration failed.', 422, 'register', 'Register']
        : ['Sorry, there was an error processing your registration.', 500, 'register', 'Register'];
    req.flash('notice', msg);
    res.status(status).render(`account/${dest}`, { title, nav: await utilities.getNav(), errors: null, lastModified: utilities.lastModified });
};

//#endregion register

//#region login
/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description build login view
 */
const loginView = async (req, res) => res.render('account/login', { title: 'Login', nav: await utilities.getNav(), errors: null, lastModified: utilities.lastModified });

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @description build view post login. If pass: home; else: login
 */
const loginHandler = async (req, res) => {
    const { account_email, account_password } = req.body;
    const accountData = await accountModel.getAccountByEmail(account_email);
    try {
        if (accountData && await bcrypt.compare(account_password, accountData.account_password)) 
            return grantJWTToken(res, accountData, () => res.redirect('/account/'));

        req.flash('notice', 'Please check your credentials and try again.');
        res.status(400).render('account/login', { title: 'Login', nav: await utilities.getNav(), errors: null, account_email, lastModified: utilities.lastModified });
    }
    catch (e) {
        res.status(403);
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
const updateView = async (req, res) => res.render('./account/update', {
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
const updateHandler = async (req, res, type) => {
    if (!['user', 'password'].includes(type)) { req.flash('notice', 'Unknown update type'); res.status(418); return updateView(req, res); }
    const { account_id, account_firstname, account_lastname, account_email, account_password } = req.body;
    let updateRes;
    try {
        updateRes = type === 'user'
            ? await accountModel.updateAccountDetailsById(account_id, account_email, account_firstname, account_lastname)
            : await accountModel.updateAccountPasswordById(account_id, await bcrypt.hashSync(account_password, 10));
        grantJWTToken(
            res, 
            updateRes.rows[0], 
            () => {
                req.flash('notice', `${type === 'user' ? 'Account information' : 'Password'} updated.`);
                res.status(201).redirect('/account/');
            }, 
            res.locals.accountData.exp - Math.floor(Date.now() / 1000)
        );
    }
    catch (e) {
        res.status(500);
        req.flash('notice', `Sorry, there was an issue updating your ${type === 'user' ? 'information' : 'password'}.`);
        updateView(req, res);
    }
};

const updateUserHandler     = (req, res) => updateHandler(req, res, 'user');
const updatePasswordHandler = (req, res) => updateHandler(req, res, 'password');

//#endregion update

//#region manage

const manageView = async (req, res, next) => res.render('./account/manage', { title: 'Manage Accounts', nav: await utilities.getNav(), accountTypeSelect: await utilities.buildAccountTypeList(true), errors: null, lastModified: utilities.lastModified });

//#region edit

const editAccountView = async (req, res, next) => {
    const account = (await accountModel.getAccountById(parseInt(req.params.account_id)) || {});
    res.render('./account/manage/edit', {
        title: `Edit ${account.account_firstname} ${account.account_lastname}`,
        nav: await utilities.getNav(),
        accountTypeSelect: await utilities.buildAccountTypeList(false, res.locals.account_type ?? account.account_type),
        errors: null,
        account_id: res.locals.account_id ?? account.account_id,
        account_email: res.locals.account_email ?? account.account_email,
        account_firstname: res.locals.account_firstname ?? account.account_firstname,
        account_lastname: res.locals.account_lastname ?? account.account_lastname,
        lastModified: utilities.lastModified
    });
};

const editAccountHandler = async (req, res, next) => {
    const account_id = req.params.account_id * 1;

    const {
        account_id: old_account_id,
        account_email: old_account_email,
        account_firstname: old_account_firstname,
        account_lastname: old_account_lastname,
        account_password: old_account_password,
        account_type: old_account_type
    } = await accountModel.getAccountById(account_id);

    const {
        account_id: new_account_id,
        account_email: new_account_email,
        account_firstname: new_account_firstname,
        account_lastname: new_account_lastname,
        account_password: new_account_password,
        account_type: new_account_type
    } = req.body;

    try {
        // if the ID in the URL is different from the ID in the request body and either is (somehow) different from the ID in the database, then something fishy is goin' on...
        if (
                account_id != old_account_id || 
            old_account_id != new_account_id || 
                account_id != new_account_id
        ) throw new Error('Account ID mismatch');

        // I... Don't know why I did this
        // I just really love ternarys
        const updateResult = await bcrypt.compare(new_account_password, old_account_password)
            ? (
                old_account_email       === new_account_email       && 
                old_account_firstname   === new_account_firstname   && 
                old_account_lastname    === new_account_lastname    && 
                old_account_type        === new_account_type
            )
                ? ( // pw unchanged, details unchanged
                    res.status(418).redirect('/account/manage'),
                    'This is impossible assuming validation works correctly.'
                )

                : await accountModel.updateAccountDetailsById( // pw unchanged, details changed
                        account_id,
                    new_account_email       ?? old_account_email,
                    new_account_firstname   ?? old_account_firstname,
                    new_account_lastname    ?? old_account_lastname,
                    new_account_type        ?? old_account_type
                )

            : (
                old_account_email       === new_account_email       && 
                old_account_firstname   === new_account_firstname   && 
                old_account_lastname    === new_account_lastname    && 
                old_account_type        === new_account_type
            )

                ? await accountModel.updateAccountPasswordById( // pw changed, details unchanged
                    account_id,
                    await bcrypt.hashSync(new_account_password, 10)
                )

                : await accountModel.updateAcountById( // pw changed, details changed
                        account_id,
                    new_account_email       ?? old_account_email,
                    new_account_firstname   ?? old_account_firstname,
                    new_account_lastname    ?? old_account_lastname,
                    await bcrypt.hashSync(new_account_password, 10),
                    new_account_type        ?? old_account_type
                )

        req.flash('notice', updateResult
            ? `${new_account_firstname} ${new_account_lastname} updated.`
            : `Failed to edit ${new_account_firstname} ${new_account_lastname}.`
        );

        res.status(updateResult
            ? 201
            : 422
        ).redirect(updateResult
            ? '/account/manage'
            : `/account/manage/edit/${account_id}`
        );
    }
    catch (e) {
        req.flash('notice', `There was an issue updating ${new_account_firstname} ${new_account_lastname}.`);
        res.status(500).redirect(`/account/manage/edit/${account_id}`);
    }
};

//#endregion edit

//#region delete

const deleteAccountView = async (req, res, next) => {
    const account = await accountModel.getAccountById(parseInt(req.params.account_id));
    res.render('./account/manage/delete', {
        title: `Delete ${account.account_firstname} ${account.account_lastname}`,
        nav: await utilities.getNav(),
        errors: null,
        account_id: account.account_id,
        account_email: account.account_email,
        account_firstname: account.account_firstname,
        account_lastname: account.account_lastname,
        account_type: account.account_type,
        lastModified: utilities.lastModified
    });
};

const deleteAccountHandler = async (req, res, next) => {
    const account_id = req.params.account_id;
    const delRes = await accountModel.deleteAccountById(account_id);

    req.flash('notice', delRes
        ? 'Account deleted.'
        : 'Deletion failed.'
    );

    res.status(delRes
        ? 201
        : 422
    ).redirect(delRes
        ? '/account/manage'
        : `/account/manage/delete/${account_id}`
    );
};

//#endregion delete

const getAccountJSON = async (req, res, next) => {
    const rows = await accountModel.getAllAccountsByType(req.params.account_type);

    if (rows.length < 1) next(new Error('No data returned'));

    return res.json(rows);
};

//#endregion manage

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @description build myAccount view
 */
const myAccountView = async (req, res) => res.render('./account/my-account', {
    title: 'My Account',
    nav: await utilities.getNav(),
    errors: null,
    lastModified: utilities.lastModified
});

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @description logs user out of account and sends them home
 */
const logoutHandler = async (req, res) => {
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
 * @param {Number} duration - time till cookie expires in miliseconds; default: 1 hour
 * @description issue new JsonWebToken
 */
const grantJWTToken = (res, accountData, cb, duration = 3600000) => {
    if (accountData.account_password) delete accountData.account_password;

    res.cookie('jwt',
        jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: duration }),
        { httpOnly: true, maxAge: duration, secure: process.env.NODE_ENV !== 'development' }
    );

    if (cb) cb();
};

module.exports = {
    loginView, loginHandler,
    registrationView, registrationHandler,
    updateView, updateUserHandler, updatePasswordHandler,
    editAccountView, editAccountHandler,
    deleteAccountView, deleteAccountHandler,
    myAccountView,
    manageView,
    logoutHandler,
    getAccountJSON
};
