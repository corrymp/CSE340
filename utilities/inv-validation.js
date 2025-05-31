const utilities = require('.');
const invModel = require('../models/inventory-model');
const { body, validationResult } = require('express-validator');

const validate = {};

const sanitize = value => body(value)
    .trim()
    .escape()
    .notEmpty()
    .withMessage(`"${value.split('_')[1]}" left empty.`);

const imagePath = value => body(value)
    .trim()
    .notEmpty()
    .withMessage(`"${value.split('_')[1]}" left empty.`)
    .matches(/^(?=(?:.*\/)).*\.(?:apng|avif|gif|jpeg|png|svg|webp|bmp|ico|tiff)$/i)
    .withMessage(`${value.split('_')[1]} should include a path and file extension.`);

const alpha = value => sanitize(value)
    .isAlpha()
    .withMessage(`${value.split('_')[1]} should only be letters.`);

const numMin0 = value => sanitize(value)
    .isFloat({ min: 0 })
    .withMessage(`${value.split('_')[1]} should only be numbers.`);

/**
 * @param {String} value - key to portion of request to check
 * @param {Boolean} shouldExist - whether the specified classification should exist or not
 * @returns {void|Error} either returns nothing or throws an error if the specified classification does(n't) exist
 */
const classificationExists = (value, shouldExist) => body(value)
    .trim()
    .escape()
    .notEmpty()
    .withMessage(`"classification" left empty.`)
    .custom(async classification => {
        const classificationExists = await invModel[value === 'classification_name' ? 'getClassificationByName' : 'getClassificationById'](classification);
        if (shouldExist && classificationExists.rows.length === 0) throw new Error('Chosen classification does not exist.');
        if (!shouldExist && classificationExists.rows.length !== 0) throw new Error('Classification already exists.');
    });

/**
 * @returns {Object[]} sanitization and validation rules to be use
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
 * @returns {Object[]} sanitization and validation rules to be use
 * @description rules to clean user provided inventory item creation details
 */
validate.invRules = () => [
    classificationExists('classification_id', true).withMessage('Please provide a valid classification.'),

    alpha('inv_make').withMessage('Please provide a valid make.'),

    alpha('inv_model').withMessage('Please provide a valid model.'),

    imagePath('inv_image').withMessage('Please provide a valid image path.'),

    imagePath('inv_thumbnail').withMessage('Please provide a valid thumbnail image path.'),

    numMin0('inv_price').withMessage('Please provide a valid price.'),

    sanitize('inv_year')
        .isInt({ min: 1886, max: 1 + new Date().getFullYear() })
        .withMessage('Please provide a valid year.'),

    numMin0('inv_miles').withMessage('Please provide a valid milage.'),

    alpha('inv_color').withMessage('Please provide a color.'),

    sanitize('inv_description').withMessage('Please provide a description.')
];

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description validate classification creation details fit required parameters
 */
validate.checkAddClassificationData = async (req, res, next) => {
    const { classification_name } = req.body;
    let errors = validationResult(req);
    if (!errors.isEmpty()) return res.render('inventory/add/classification', { errors, title: 'Add Classification', nav: await utilities.getNav(), classification_name, lastModified: utilities.lastModified });
    next();
};

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description validate inventory item creation details fit required parameters
 */
validate.checkAddInvData = async (req, res, next) => {
    const { classification_id, inv_make, inv_model, inv_image, inv_thumbnail, inv_price, inv_year, inv_miles, inv_color, inv_description } = req.body;
    let errors = validationResult(req);
    if (!errors.isEmpty()) return res.render('inventory/add/inventory', { errors, title: 'Add Vehicle', nav: await utilities.getNav(), classification_opts: await utilities.buildClassificationList(classification_id), inv_make, inv_model, inv_image, inv_thumbnail, inv_price, inv_year, inv_miles, inv_color, inv_description, lastModified: utilities.lastModified });
    next();
};

module.exports = validate;
