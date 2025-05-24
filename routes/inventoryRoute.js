const express = require('express');
const router = new express.Router();
const invController = require('../controllers/invController');

// Route to build inventroy by classification view
router.get('/type/:classificationId', invController.buildByClassificationId);
router.get('/detail/:vehicleId', invController.buildByVehicleId);
router.get('/ouch', invController.ouch);

module.exports = router;
