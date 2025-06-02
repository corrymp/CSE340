const express = require('express');
const router = new express.Router();
const accountController = require('../controllers/accountController');
const accValidate = require('../utilities/account-validation');
const utilities = require('../utilities');
const uhe = utilities.handleErrors;

// Route to build login view
router.get(
    '/login', 
    uhe(accountController.buildLogin)
);

// Route to build registration view
router.get(
    '/register', 
    uhe(accountController.buildRegister)
);

// Route to register new account
router.post(
    '/register', 
    accValidate.registrationRules(), 
    uhe(accValidate.checkRegData), 
    uhe(accountController.registerAccount)
);

// Route to login account
router.post(
    '/login', 
    accValidate.loginRules(), 
    uhe(accValidate.checkLoginData), 
    uhe(accountController.accountLogin)
);

// Route 
router.get(
    '/',
    utilities.checkLogin,
    uhe(accountController.accountManagement)
);

module.exports = router;
