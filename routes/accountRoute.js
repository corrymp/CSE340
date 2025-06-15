//#region depencencies
const express = require('express');
const router = new express.Router();
const mgmtRoute = require('./accountManagementRoute');
const accCtrl = require('../controllers/accountController');
const val = require('../utilities/account-validation');
const util = require('../utilities');
const uhe = util.handleErrors;
//#endregion dependencies

// Method   Path                            Permissions             Validation Rules                                        Validation Check                         Destination Controller
router.use( '/manage',                      util.checkAdmin,                                                                                                         mgmtRoute                         );

//#region create                                                                                                                                                                                         
router.get( '/register',                    util.checkLoggedOut,                                                                                                     uhe(accCtrl.registrationView     ));
router.post('/register',                    util.checkLoggedOut,    (req,res,next)=>val.registrationRules(req,res,next),    uhe(val.validateRegistrationRequest),    uhe(accCtrl.registrationHandler  ));
//#endregion create                                 

//#region read                                                                                                                                                                                           
router.get( '/login',                       util.checkLoggedOut,                                                                                                     uhe(accCtrl.loginView            ));
router.post('/login',                       util.checkLoggedOut,    val.loginRules(),                                       uhe(val.validateLoginRequest),           uhe(accCtrl.loginHandler         ));
router.get( '/logout', /*log-out handler*/  util.checkLogin,                                                                                                         uhe(accCtrl.logoutHandler        ));
router.get( '/getAccounts/:account_type',   util.checkAdmin,                                                                                                         uhe(accCtrl.getAccountJSON       ));
//#endregion read                               

//#region update                                                                                                                                                                                         
router.get( '/update/:account_id',          util.checkLogin,                                                                                                         uhe(accCtrl.updateView           ));
router.post('/update/user',                 util.checkLogin,        (req,res,next)=>val.updateAccountRules(req,res,next),   uhe(val.validateAccountUpdateRequest),   uhe(accCtrl.updateUserHandler    ));
router.post('/update/password',             util.checkLogin,        (req,res,next)=>val.updatePasswordRules(req,res,next),  uhe(val.validatePasswordUpdateRequest),  uhe(accCtrl.updatePasswordHandler));
//#endregion update                              

router.get( '/', /* myAccount view */       util.checkLogin,                                                                                                         uhe(accCtrl.myAccountView        ));

module.exports = router;
