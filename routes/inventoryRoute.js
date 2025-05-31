const express = require('express');
const router = new express.Router();
const invController = require('../controllers/invController');
const invValidate = require('../utilities/inv-validation');
const utilities = require('../utilities');
const uhe = utilities.handleErrors;

// Route to build inventroy by classification view
router.get(
    '/type/:classificationId', 
    uhe(invController.buildByClassificationId)
);

// Route to build inventroy item view
router.get(
    '/detail/:vehicleId', 
    uhe(invController.buildByVehicleId)
);

// Route to build add classification view
router.get(
    '/add/classification', 
    uhe(invController.buildAddClassification)
);

// Route to build add inventroy item view
router.get(
    '/add/inventory', 
    uhe(invController.buildAddInventory)
);

// Route to add new classification
router.post(
    '/add/classification', 
    invValidate.classificationRules(), 
    uhe(invValidate.checkAddClassificationData), 
    uhe(invController.addClassification)
);

// Route to add new inventory item
router.post(
    '/add/inventory', 
    invValidate.invRules(), 
    uhe(invValidate.checkAddInvData), 
    uhe(invController.addInventory)
);

// Route to add throw an error
router.get(
    '/ouch', 
    uhe(invController.ouch)
);

// Route to build inventory management view
router.get(
    '/', 
    uhe(invController.buildManagement)
);

module.exports = router;
