//#region depencencies
const express = require('express');
const router = new express.Router();
const accCtrl = require('../controllers/accountController');
const validate = require('../utilities/account-validation');
const util = require('../utilities');
const uhe = util.handleErrors;
//#endregion dependencies

// Method   Path                    Validation Rules                        Validation Check                                    Destination Controller
//#region read
router.get( '/',                                                                                                                uhe(accCtrl.manageView          ));
//#endregion read

//#region update
router.get( '/edit/:account_id',                                                                                                uhe(accCtrl.editAccountView     ));
router.post('/edit/:account_id',    validate.managementAccountEditRules(),  uhe(validate.validateManagementAccountEditRequest), uhe(accCtrl.editAccountHandler  ));
//#endregion update

//#region delete
router.get( '/delete/:account_id',                                                                                              uhe(accCtrl.deleteAccountView   ));
router.post('/delete/:account_id',                                                                                              uhe(accCtrl.deleteAccountHandler));
//#endregion delete

module.exports = router;
