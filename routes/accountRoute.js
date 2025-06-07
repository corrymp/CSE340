//#region depencencies
const express = require('express');
const router = new express.Router();
const accountController = require('../controllers/accountController');
const accValidate = require('../utilities/account-validation');
const utilities = require('../utilities');
const uhe = utilities.handleErrors;
//#endregion dependencies

//#region not logged in
//#region login
// view
router.get('/login', utilities.checkLoggedOut, uhe(accountController.buildLogin));

// handler
router.post('/login', utilities.checkLoggedOut, accValidate.loginRules(), uhe(accValidate.checkLoginData), uhe(accountController.accountLogin));
//#endregion login

//#region register
// view
router.get('/register', utilities.checkLoggedOut, uhe(accountController.buildRegister));

// handler
router.post('/register', utilities.checkLoggedOut, accValidate.registrationRules(), uhe(accValidate.checkRegData), uhe(accountController.registerAccount));
//#endregion register
//#endregion not logged in

//#region logged in
//#region update
// view
router.get('/update/:account_id', utilities.checkLogin, uhe(accountController.buildAccountUpdate));

// account handler
router.post('/update/user', utilities.checkLogin, accValidate.updateAccountRules(), uhe(accValidate.checkAccountUpdate), uhe((req, res) => accountController.updateAccount(req, res, 'user')));

// password handler
router.post('/update/password', utilities.checkLogin, accValidate.updatePasswordRules(), uhe(accValidate.checkAccountUpdate), uhe((req, res) => accountController.updateAccount(req, res, 'password')));
//#endregion update

// log-out handler
router.get('/logout', utilities.checkLogin, uhe(accountController.accountLogout));

// management view
router.get('/', utilities.checkLogin, uhe(accountController.buildManagement));
//#endregion logged in

module.exports = router;
