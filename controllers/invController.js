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

    const [msg, status, dest, title] = addClassificationResult
        ? [`${classification_name} classification successfully added.`, 201, 'management', 'Inventory Management']
        : [`Failed to add classification "${classification_name}".`, 501, 'add/classification', 'Add Classififcation'];

    // I forgot to include "'notice'" and spent 2 days banging my head against the table trying to figure it out
    req.flash('notice', msg);
    
    res.status(status).render(`inventory/${dest}`, {
        title,
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
    classification_opts: await utilities.buildClassificationList(),
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
        console.error('\n!!!Error!!!\n', e, '\n!!!Error!!!\n')
        addInventoryResult = false; // just to be sure :shrug:
    }

    const [msg, status, dest, title] = addInventoryResult
        ? [`${inv_year} ${inv_make} ${inv_model} successfully added.`, 201, 'management', 'Inventory Management']
        : [`Failed to add vehicle "${inv_year} ${inv_make} ${inv_model}".`, 501, 'add/inventory', 'Add Inventory'];

    req.flash('notice', msg);

    res.status(status).render(`inventory/${dest}`, {
        title,
        nav: await utilities.getNav(),
        errors: null,
        classification_opts: await utilities.buildClassificationList(classification_id),
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
    errors: null,
    lastModified: utilities.lastModified
});

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description cause an error
 */
invCont.ouch = async (req, res, next) => next(new Error('ouch'));

module.exports = invCont;
