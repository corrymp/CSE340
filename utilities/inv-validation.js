//#region dependencies
const utilities = require('.');
const invModel = require('../models/inventory-model');
const { body, validationResult } = require('express-validator');
//#endregion dependencies

const validate = {};

/**
 * @param {String} value - value being checked to display fail message for
 * @param {String} msg - message content to include
 * @returns {String} build validation fail message
 */
const msg = (value, msg) => `${value.split('_')[1]} ${msg}.`;

//#region individual rules

/**
 * @param {String|Number} value - form input to sanitize and validate
 * @returns validation results
 */
const sanitize = value => body(value)
    .trim()
    .escape()
    .notEmpty()
    .withMessage(msg(value, 'left empty'));

/**
 * @param {String} value - form image input to sanitize and validate
 * @returns validation results
 * @description verifies that starting at the start of the string a "/" is found with any characters following, and that the string ends with a valid ".(extension)"
 */
const imagePath = value => body(value)
    .trim()
    .notEmpty()
    .withMessage(msg(value, 'left empty'))
    .matches(/^(?=(?:.*\/)).*\.(?:apng|avif|gif|jpg|jpeg|jfif|pjpeg|pjp|png|svg|webp|bmp|ico|cur|tif|tiff)$/i)
    .withMessage(msg(value, 'should include a path and file extension'));

/**
 * @param {Number} value - form input to sanitize and validate
 * @returns validation results
 * @description verifies that the input is a number and greater than or equal to 0
 */
const numMin0 = value => sanitize(value)
    .isFloat({ min: 0 })
    .withMessage(msg(value, 'should only be numbers'));

/**
 * @param {String} value - key to portion of request to check
 * @param {Boolean} shouldExist - whether the specified classification should exist or not
 * @returns {void|Error} either returns nothing or throws an error if the specified classification does(n't) exist
 */
const classificationExists = (value, shouldExist) => body(value)
    .trim()
    .escape()
    .notEmpty()
    .withMessage('classification left empty.')
    .custom(async classification => {
        if(!classification) throw new Error('No classification provided.');
        const classificationExists = await invModel[value === 'classification_name' ? 'getClassificationByName' : 'getClassificationById'](classification);
        if (shouldExist && classificationExists.rows.length === 0) throw new Error('Chosen classification does not exist.');
        if (!shouldExist && classificationExists.rows.length !== 0) throw new Error('Classification already exists.');
    });

//#endregion individual rules

//#region rule collections

/**
 * @returns {Object[]} sanitization and validation rules to be use with classification requests
 * @description rule to clean user provided classification name
 */
validate.classificationRules = () => [
    classificationExists('classification_name', false)
        .isLength({ min: 3 })
        .withMessage('Classification name should be at least 3 letters.')
        .isAlpha()
        .withMessage('Classification name chould only include letters.')
];

/**
 * @returns {Object[]} sanitization and validation rules to be use with inventory requests
 * @description rules to clean user provided inventory item creation details
 */
validate.invRules = () => [
    classificationExists('classification_id', true).withMessage('Please provide a valid classification.'),
    sanitize('inv_make')        .withMessage('Please provide a valid make.'),
    sanitize('inv_model')       .withMessage('Please provide a valid model.'),
    imagePath('inv_image')      .withMessage('Please provide a valid image path.'),
    imagePath('inv_thumbnail')  .withMessage('Please provide a valid thumbnail image path.'),
    numMin0('inv_price')        .withMessage('Please provide a valid price.'),
    numMin0('inv_miles')        .withMessage('Please provide a valid milage.'),
    sanitize('inv_description') .withMessage('Please provide a description.'),

    sanitize('inv_year')
        .isInt({ min: 1886, max: 1 + new Date().getFullYear() })
        .withMessage('Please provide a valid year.'),

    sanitize('inv_color')
        .withMessage('Please provide a color.')
        .isAlpha()
        .withMessage('color should only be letters.')
];

//#endregion rule collections

//#region validators

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description validate that classification creation details fit required parameters
 */
validate.checkAddClassificationData = async (req, res, next) => {
    const { classification_name } = req.body;
    let errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).render('inventory/add/classification', { errors, title: 'Add Classification', nav: await utilities.getNav(), classification_name, lastModified: utilities.lastModified });
    next();
};

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description validate that inventory item creation details fit required parameters
 */
validate.checkAddInvData = async (req, res, next) => {
    const { classification_id, inv_make, inv_model, inv_image, inv_thumbnail, inv_price, inv_year, inv_miles, inv_color, inv_description } = req.body;
    let errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).render('inventory/add/inventory', { errors, title: 'Add Vehicle', nav: await utilities.getNav(), classificationSelect: await utilities.buildClassificationList(classification_id), inv_make, inv_model, inv_image, inv_thumbnail, inv_price, inv_year, inv_miles, inv_color, inv_description, lastModified: utilities.lastModified });
    next();
};

//#endregion validators

module.exports = validate;
