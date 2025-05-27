const express = require('express');
const router = new express.Router();
const invController = require('../controllers/invController');
const utilities = require('../utilities');

// Route to build inventroy by classification view
router.get('/type/:classificationId', utilities.handleErrors(invController.buildByClassificationId));
router.get('/detail/:vehicleId', utilities.handleErrors(invController.buildByVehicleId));
router.get('/ouch', utilities.handleErrors(invController.ouch));

module.exports = router;
