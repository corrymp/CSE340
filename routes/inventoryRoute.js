//#region dependencies
const express = require('express');
const router = new express.Router();
const invController = require('../controllers/invController');
const invValidate = require('../utilities/inv-validation');
const utilities = require('../utilities');
const uhe = utilities.handleErrors;
//#endregion dependencies

//#region admin
//#region add classification
// view
router.get('/add/classification', utilities.checkAdmin, uhe(invController.buildAddClassification));

// handler
router.post('/add/classification', utilities.checkAdmin, invValidate.classificationRules(), uhe(invValidate.checkAddClassificationData), uhe(invController.addClassification));
//#endregion add classification

//#region add inventory
// view
router.get('/add/inventory', utilities.checkAdmin, uhe(invController.buildAddInventory));

// handler
router.post('/add/inventory', utilities.checkAdmin, invValidate.invRules(), uhe(invValidate.checkAddInvData), uhe(invController.addInventory));
//#endregion add inventory
//#endregion admin

//#region employee
//#region update inventory
// view
router.get('/edit/:inv_id', utilities.checkEmployee, uhe(invController.editInvItemView));

// handler
router.post('/update', utilities.checkEmployee, invValidate.invRules(), uhe(invValidate.checkAddInvData), uhe(invController.updateInventory))
//#endregion update inventory

//#region delete inventory
// view
router.get('/delete/:inv_id', utilities.checkEmployee, uhe(invController.delItemView));

// handler
router.post('/delete', utilities.checkEmployee, uhe(invController.deleteInventoryItem));
//#endregion delete inventory

// get inventory JSON route
router.get('/getInventory/:classification_id', utilities.checkEmployee, uhe(invController.getInventoryJSON));
//#endregion employee

//#region global
// classification view
router.get('/type/:classificationId', uhe(invController.buildByClassificationId));

// inventory view
router.get('/detail/:vehicleId', uhe(invController.buildByVehicleId));

// throw error route
router.get('/ouch', uhe(invController.ouch));
//#endregion global

// management view | employee only
router.get('/', utilities.checkEmployee, uhe(invController.buildManagement));

module.exports = router;
