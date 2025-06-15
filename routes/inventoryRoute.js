//#region dependencies
const express = require('express');
const router = new express.Router();
const invCtrl = require('../controllers/invController');
const validate = require('../utilities/inv-validation');
const util = require('../utilities');
const uhe = util.handleErrors;
//#endregion dependencies

//  Method  Path                                         Permissions         Validation Rules                Validation Check                          Destination Controller
router.get( '/ouch', /* throw error route */                                                                                                           uhe(invCtrl.ouch)                       );

//#region create                                                                                                                                                                               
router.get( '/add/classification',                       util.checkAdmin,                                                                              uhe(invCtrl.addClassificationView)      );
router.post('/add/classification',                       util.checkAdmin,    validate.classificationRules(), uhe(validate.checkAddClassificationData), uhe(invCtrl.addClassificationHandler)   );
router.post('/add/inventory',                            util.checkAdmin,    validate.invRules(),            uhe(validate.checkAddInvData),            uhe(invCtrl.addInventoryHandler)        );
router.get( '/add/inventory',                            util.checkAdmin,                                                                              uhe(invCtrl.addInventoryView)           );
//#endregion create                                                                                                                                                                            

//#region read                                                                                                                                                                                 
router.get('/getInventory/:classification_id',           util.checkEmployee,                                                                           uhe(invCtrl.getInventoryJSON)           );
router.get('/type/:classificationId',                                                                                                                  uhe(invCtrl.classificationView)         );
router.get('/detail/:vehicleId',                                                                                                                       uhe(invCtrl.vehicleView)                );
//#endregion read                                                                                                                                                                              

//#region update                                                                                                                                                                               
router.get( '/edit/classification/:classification_id',   util.checkEmployee,                                                                           uhe(invCtrl.editClassificationView)     );
router.post('/update/classification/:classification_id', util.checkEmployee, validate.classificationRules(), uhe(validate.checkAddClassificationData), uhe(invCtrl.editClassificationHandler)  );
router.get( '/edit/inventory/:inv_id',                   util.checkEmployee,                                                                           uhe(invCtrl.editInventoryView)          );
router.post('/update/inventory/:inv_id',                 util.checkEmployee, validate.invRules(),            uhe(validate.checkAddInvData),            uhe(invCtrl.editInventoryHandler)       );
//#endregion update                                                                                                                                                                            

//#region delete                                                                                                                                                                               
router.get( '/delete/classification/:classification_id', util.checkAdmin,                                                                              uhe(invCtrl.deleteClassificationView)   );
router.post('/delete/classification/:classification_id', util.checkAdmin,                                                                              uhe(invCtrl.deleteClassificationHandler));
router.get( '/delete/inventory/:inv_id',                 util.checkEmployee,                                                                           uhe(invCtrl.deleteInventoryView)        );
router.post('/delete/inventory/:inv_id',                 util.checkEmployee,                                                                           uhe(invCtrl.deleteInventoryHandler)     );
//#endregion delete                                                                                                                                                                            

router.get( '/', /* management view | employee only */   util.checkEmployee,                                                                           uhe(invCtrl.managementView)             );

module.exports = router;
