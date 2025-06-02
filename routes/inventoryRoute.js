const express = require('express');
const router = new express.Router();
const invController = require('../controllers/invController');
const invValidate = require('../utilities/inv-validation');
const utilities = require('../utilities');
const uhe = utilities.handleErrors;

// view inventroy by classification route
router.get(
    '/type/:classificationId', 
    uhe(invController.buildByClassificationId)
);

// view inventroy item route
router.get(
    '/detail/:vehicleId', 
    uhe(invController.buildByVehicleId)
);

// add classification form route
router.get(
    '/add/classification', 
    uhe(invController.buildAddClassification)
);

// add inventroy item form route
router.get(
    '/add/inventory', 
    uhe(invController.buildAddInventory)
);

// add new classification submission route
router.post(
    '/add/classification', 
    invValidate.classificationRules(), 
    uhe(invValidate.checkAddClassificationData), 
    uhe(invController.addClassification)
);

// add new inventory item submission route
router.post(
    '/add/inventory', 
    invValidate.invRules(), 
    uhe(invValidate.checkAddInvData), 
    uhe(invController.addInventory)
);

// get inventory JSON route
router.get(
    '/getInventory/:classification_id',
    uhe(invController.getInventoryJSON)
);

router.get(
    '/edit/:inv_id',
    uhe(invController.editInvItemView)
);

router.post(
    '/update',
    invValidate.invRules(), 
    uhe(invValidate.checkAddInvData), 
    uhe(invController.updateInventory)
)

// throw error route
router.get(
    '/ouch', 
    uhe(invController.ouch)
);

// inventory management route
router.get(
    '/', 
    uhe(invController.buildManagement)
);

module.exports = router;
