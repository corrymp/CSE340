const express = require('express');
const router = new express.Router();
const accountController = require('../controllers/accountController');
const regValidate = require('../utilities/account-validation');
const utilities = require('../utilities');

// Route to build inventroy by classification view
router.get('/login', utilities.handleErrors(accountController.buildLogin));
router.get('/register', utilities.handleErrors(accountController.buildRegister));
router.post('/register', regValidate.registrationRules(), regValidate.checkRegData, utilities.handleErrors(accountController.registerAccount));

module.exports = router;
