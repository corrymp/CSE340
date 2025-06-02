const { parse } = require('dotenv');
const invModel = require('../models/inventory-model');
const utilities = require('../utilities');
const invCont = {};

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description build inventory by classification view
 */
invCont.buildByClassificationId = async (req, res, next) => {
    const classification_id = req.params.classificationId;
    const data = await invModel.getInventoryByClassificationId(classification_id);

    /*
        the classification name can be accessed through any inventory item... 
        **IF** there are any inventory items available!
        if there are not, we need to look up the name.
        if there are no classifications with the provided ID, then the user should not be here so we send them home
    */
    let title;

    if (data?.rows?.length > 0) title = `${data.rows[0].classification_name} vehicles`;
    else {
        const classification = await invModel.getClassificationById(classification_id);
        if (classification?.rows?.length > 0) title = `${classification.rows[0].classification_name} vehicles`;
        else return res.redirect('/');
    }

    res.render('./inventory/classification', {
        title,
        nav: await utilities.getNav(),
        grid: await utilities.buildClassificationGrid(data),
        errors: null,
        lastModified: utilities.lastModified
    });
};

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description build inventory item by ID view
 */
invCont.buildByVehicleId = async (req, res, next) => {
    const data = await invModel.getInventoryById(req.params.vehicleId);
    const pageData = await utilities.buildInventoryPage(data.rows[0]);

    res.render('./inventory/detail', {
        title: pageData[0],
        nav: await utilities.getNav(),
        page: pageData[1],
        errors: null,
        lastModified: utilities.lastModified
    });
};

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description build inventory item by ID view
 */
invCont.buildAddClassification = async (req, res, next) => res.render('inventory/add/classification', {
    title: 'Add Classification',
    nav: await utilities.getNav(),
    errors: null,
    lastModified: utilities.lastModified
});

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description build post add classification view. If pass: management; else: add classification
 */
invCont.addClassification = async (req, res, next) => {
    const { classification_name } = req.body;
    let addClassificationResult;

    try {
        addClassificationResult = await invModel.addClassification(classification_name);
    }
    catch (e) {
        addClassificationResult = false; // just to be sure :shrug:
    }

    // I forgot to include "'notice'" and spent 2 days banging my head against the table trying to figure it out
    req.flash('notice', addClassificationResult ? `${classification_name} classification successfully added.` : `Failed to add classification "${classification_name}".`);

    addClassificationResult
        ? res.status(201).redirect('/inv')
        : res.status(501).render('inventory/add/classification', {
            title: 'Add Classififcation',
            nav: await utilities.getNav(),
            errors: null,
            classification_name,
            lastModified: utilities.lastModified
        });
};

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description build inventory item by ID view
 */
invCont.buildAddInventory = async (req, res, next) => res.render('inventory/add/inventory', {
    title: 'Add Inventory',
    nav: await utilities.getNav(),
    classificationSelect: await utilities.buildClassificationList(),
    errors: null,
    lastModified: utilities.lastModified
});

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description build post add inventory view. If pass: management; else: add inventory
 */
invCont.addInventory = async (req, res, next) => {
    const { classification_id, inv_make, inv_model, inv_image, inv_thumbnail, inv_price, inv_year, inv_miles, inv_color, inv_description } = req.body;

    let addInventoryResult;

    try {
        addInventoryResult = await invModel.addInventory(classification_id, inv_make, inv_model, inv_image, inv_thumbnail, inv_price, inv_year, inv_miles, inv_color, inv_description);
    }
    catch (e) {
        addInventoryResult = false; // just to be sure :shrug:
    }

    req.flash('notice', addInventoryResult ? `${inv_year} ${inv_make} ${inv_model} successfully added.` : `Failed to add vehicle "${inv_year} ${inv_make} ${inv_model}".`);

    addInventoryResult
        ? res.status(201).redirect('/inv')
        : res.status(501).render('inventory/add/inventory', {
            title: 'Add Inventory',
            nav: await utilities.getNav(),
            errors: null,
            classificationSelect: await utilities.buildClassificationList(classification_id),
            inv_make,
            inv_model,
            inv_image,
            inv_thumbnail,
            inv_price,
            inv_year,
            inv_miles,
            inv_color,
            inv_description,
            lastModified: utilities.lastModified
        });
};

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description build main inventory management view
 */
invCont.buildManagement = async (req, res, next) => res.render('inventory/management', {
    title: 'Inventory Management',
    nav: await utilities.getNav(),
    classificationSelect: await utilities.buildClassificationList(),
    errors: null,
    lastModified: utilities.lastModified
});

invCont.getInventoryJSON = async (req, res, next) => {
    const invData = await invModel.getInventoryByClassificationId(parseInt(req.params.classification_id));

    if (invData[0]?.inv_id) return res.json(invData);
    else next(new Error('No data returned'));
};

invCont.editInvItemView = async (req, res, next) => {
    const invData = (await invModel.getInventoryById(parseInt(req.params.inv_id))).rows[0];

    res.render('./inventory/update/inventory', {
        title: `Edit ${invData.inv_make} ${invData.inv_model}`,
        nav: await utilities.getNav(),
        classificationSelect: await utilities.buildClassificationList(invData.classification_id),
        errors: null,
        inv_id: invData.inv_id,
        inv_make: invData.inv_make,
        inv_model: invData.inv_model,
        inv_year: invData.inv_year,
        inv_description: invData.inv_description,
        inv_image: invData.inv_image,
        inv_thumbnail: invData.inv_thumbnail,
        inv_price: invData.inv_price,
        inv_miles: invData.inv_miles,
        inv_color: invData.inv_color,
        classification_id: invData.classification_id,
        lastModified: utilities.lastModified
    });
}

invCont.updateInventory = async (req, res, next) => {
    const {
        inv_id,
        inv_make,
        inv_model,
        inv_description,
        inv_image,
        inv_thumbnail,
        inv_price,
        inv_year,
        inv_miles,
        inv_color,
        classification_id
    } = req.body;

    const updateResult = await invModel.updateInventory(
        inv_id,
        inv_make,
        inv_model,
        inv_description,
        inv_image,
        inv_thumbnail,
        inv_price,
        inv_year,
        inv_miles,
        inv_color,
        classification_id
    );

    const itemName = `${updateResult.inv_make} ${updateResult.inv_model}`;

    req.flash('notice', updateResult
        ? `${itemName} was successfully updated.`
        : 'Update failed.'
    );

    updateResult
        ? res.redirect('/inv')
        : res.render('inventory/edit/inventory', {
            title: `Edit ${itemName}`,
            nav: await utilities.getNav(),
            classificationSelect: await utilities.buildClassificationList(classification_id),
            errors: null,
            inv_id,
            inv_make,
            inv_model,
            inv_description,
            inv_image,
            inv_thumbnail,
            inv_price,
            inv_year,
            inv_miles,
            inv_color,
            classification_id,
            lastModified: utilities.lastModified
        });
}

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description cause an error
 */
invCont.ouch = async (req, res, next) => next(new Error('ouch'));

module.exports = invCont;
