//#region dependencies
const invModel = require('../models/inventory-model');
const util = require('../utilities');
const invCtrl = {};
//#endregion dependencies

//#region create
/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description build inventory item by ID view
 */
invCtrl.addClassificationView = async (req, res, next) => res.render('inventory/add/classification', { title: 'Add Classification', nav: await util.getNav(), errors: null, lastModified: util.lastModified });

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description build post add classification view. If pass: management; else: add classification
 */
invCtrl.addClassificationHandler = async (req, res, next) => {
    const { classification_name } = req.body;
    let addRes;
    try { addRes = await invModel.addClassification(classification_name); }
    catch (e) { addRes = false; } // just to be sure :shrug:
    req.flash('notice', addRes ? `${classification_name} classification successfully added.` : `Failed to add classification "${classification_name}".`);
    res.status(addRes ? 201 : 500).redirect(addRes ? '/inv' : '/inv/add/classification')
};

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description build inventory item by ID view
 */
invCtrl.addInventoryView = async (req, res, next) => res.render('inventory/add/inventory', { title: 'Add Inventory', nav: await util.getNav(), classificationSelect: await util.buildClassificationList(), errors: null, lastModified: util.lastModified });

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description build post add inventory view. If pass: management; else: add inventory
 */
invCtrl.addInventoryHandler = async (req, res, next) => {
    const { classification_id, inv_make, inv_model, inv_image, inv_thumbnail, inv_price, inv_year, inv_miles, inv_color, inv_description } = req.body;
    let addRes;
    try { addRes = await invModel.addInventory(classification_id, inv_make, inv_model, inv_image, inv_thumbnail, inv_price, inv_year, inv_miles, inv_color, inv_description); }
    catch (e) { addRes = false; } // just to be sure :shrug:
    req.flash('notice', addRes ? `${inv_year} ${inv_make} ${inv_model} successfully added.` : `Failed to add vehicle "${inv_year} ${inv_make} ${inv_model}".`);
    res.status(addRes ? 201 : 500).redirect(addRes ? '/inv' : '/inv/add/inventory');
};
//#endregion create
//#region read
/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description build inventory by classification view
 */
invCtrl.classificationView = async (req, res, next) => {
    const classification_id = req.params.classificationId;
    const data = await invModel.getAllInventoryByClassificationId(classification_id);
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
        else return res.status(404).redirect('/');
    }
    res.render('./inventory/classification', { title, nav: await util.getNav(), grid: await util.buildClassificationGrid(data), errors: null, lastModified: util.lastModified });
};

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description build inventory item by ID view
 */
invCtrl.vehicleView = async (req, res, next) => {
    const [title, page] = await util.buildInventoryDetailsView((await invModel.getInventoryById(req.params.vehicleId)).rows[0]);
    res.render('./inventory/detail', { title, nav: await util.getNav(), page, errors: null, lastModified: util.lastModified });
};

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description build main inventory management view
 */
invCtrl.managementView = async (req, res, next) => res.render('inventory/management', { title: 'Inventory Management', nav: await util.getNav(), classificationSelect: await util.buildClassificationList(), errors: null, lastModified: util.lastModified });

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @returns {Object[]} array of all inventory of given classification
 */
invCtrl.getInventoryJSON = async (req, res, next) => {
    const invData = await invModel.getAllInventoryByClassificationId(parseInt(req.params.classification_id));
    if (invData[0]?.inv_id) return res.json(invData);
    else next(new Error('No data returned'));
};
//#endregion read
//#region update

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description build edit classification view
 */
invCtrl.editClassificationView = async (req, res, next) => {
    const {classification_id, classification_name} = (await invModel.getClassificationById(parseInt(req.params.classification_id))).rows[0];
    res.render('./inventory/update/classification', {
        title:                  `Edit ${classification_name}`,
        nav:                    await util.getNav(),
        errors:                 null,
        lastModified:           util.lastModified,
        classification_id, 
        classification_name
    });
};

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description attempts to update the given inventory item. if pass: redirect to management view; else: re-open edit view
 */
invCtrl.editClassificationHandler = async (req, res, next) => {
    const { classification_id, classification_name } = req.body;
    if(classification_id !== req.params.classification_id) throw new Error('ID mismatch');
    const editRes = await invModel.updateInventoryById( {...req.body} );
    req.flash('notice', editRes ? `${editRes.classification_name} was successfully updated.` : `Failed to update ${classification_name}.` );
    res.status(editRes ? 201 : 500).redirect(editRes ? '/inv' : `/inv/update/classification/${inv_id}`);
};

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description build edit inventory view
 */
invCtrl.editInventoryView = async (req, res, next) => {
    const {inv_id, inv_make, inv_model, inv_year, inv_description, inv_image, inv_thumbnail, inv_price, inv_miles, inv_color, classification_id} = (await invModel.getInventoryById(parseInt(req.params.inv_id))).rows[0];
    res.render('./inventory/update/inventory', {
        title:                  `Edit ${inv_make} ${inv_model}`,
        nav:                    await util.getNav(),
        classificationSelect:   await util.buildClassificationList(classification_id),
        errors:                 null,
        lastModified:           util.lastModified,
        inv_id, inv_make, inv_model, inv_year, inv_description, inv_image, inv_thumbnail, inv_price, inv_miles, inv_color, classification_id
    });
};

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description attempts to update the given inventory item. if pass: redirect to management view; else: re-open edit view
 */
invCtrl.editInventoryHandler = async (req, res, next) => {
    const {inv_id, inv_make, inv_model, inv_description, inv_image, inv_thumbnail, inv_price, inv_year, inv_miles, inv_color, classification_id} = req.body;
    if(inv_id !== req.params.inv_id) throw new Error('ID Mismatch');
    const editRes = await invModel.updateInventoryById(inv_id, inv_make, inv_model, inv_description, inv_image, inv_thumbnail, inv_price, inv_year, inv_miles, inv_color, classification_id);
    req.flash('notice', editRes ? `${editRes.inv_make} ${editRes.inv_model} was successfully updated.` : `Failed to update ${inv_make} ${inv_model}.` );
    res.status(editRes ? 201 : 500).redirect(editRes ? '/inv' : `/inv/edit/inventory/${inv_id}`);
};
//#endregion update
//#region delete
/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description build delete inventory confirmation view
 */
invCtrl.deleteClassificationView = async (req, res, next) => {
    const { classification_id, classification_name } = (await invModel.getClassificationById(parseInt(req.params.classification_id))).rows[0];
    res.render('./inventory/delete/classification', {
        title:          `Delete ${classification_name}`,
        nav:            await util.getNav(),
        inventoryList:  await util.buildInventoryList(await invModel.getAllInventoryByClassificationId(classification_id)),
        errors:         null,
        lastModified:   util.lastModified,
        classification_id, 
        classification_name
    });
};

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description attempts to delete the given inventory item. if pass: redirect to management view; else: re-open delete view
 */
invCtrl.deleteClassificationHandler = async (req, res, next) => {
    const {classification_id} = req.body;
    if(classification_id !== req.params.classification_id) throw new Error('ID mismatch');
    const delRes = await invModel.deleteClassificationById(classification_id);
    req.flash('notice', delRes ? `Classification and any inventory under it have been deleted.` : `Failed to delete classification`);
    res.status(delRes ? 200 : 500).redirect(delRes ? '/inv' : `/inv/delete/classification/${classification_id}`);
};

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description build delete inventory confirmation view
 */
invCtrl.deleteInventoryView = async (req, res, next) => {
    const { inv_id, inv_make, inv_model, inv_year, inv_price } = (await invModel.getInventoryById(parseInt(req.params.inv_id))).rows[0];
    res.render('./inventory/delete/inventory', {
        title:          `Delete ${inv_make} ${inv_model}`,
        nav:            await util.getNav(),
        errors:         null,
        lastModified:   util.lastModified,
        inv_id, 
        inv_make, 
        inv_model, 
        inv_year, 
        inv_price
    });
};

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description attempts to delete the given inventory item. if pass: redirect to management view; else: re-open delete view
 */
invCtrl.deleteInventoryHandler = async (req, res, next) => {
    const inv_id = req.body.inv_id;
    const delRes = await invModel.deleteInventoryById(inv_id);
    req.flash('notice', delRes ? 'Item deleted.' : 'Deletion failed.');
    res.status(delRes ? 200 : 500).redirect(delRes ? '/inv' : `/inv/delete/inventory/${inv_id}`);
};
//#endregion delete

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description cause an error
 */
invCtrl.ouch = async (req, res, next) => (req.flash('notice', '*An error, as requested*'), res.status(418), next(new Error('ouch')));

module.exports = invCtrl;
