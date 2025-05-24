const invModel = require('../models/inventory-model');
const utilities = require('../utilities');
const invCont = {};

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description build inventory by classification view
 */
invCont.buildByClassificationId = async function (req, res, next) {
    const classification_id = req.params.classificationId;

    const data = await invModel.getInventoryByClassificationId(classification_id);
    const grid = await utilities.buildClassificationGrid(data);
    const nav = await utilities.getNav();

    /*
        the classification name can be accessed through any inventory item... 
        **IF** there are any inventory items available!
        if there are not, we need to look up the name.
        if there are no classifications with the provided ID, then the user should not be here so we send them home
    */
    let title;

    if (data && data[0]?.classification_name) title = `${data[0].classification_name} vehicles`;
    else {
        const classification = await invModel.getClassificationById(classification_id);

        if (classification && classification[0]?.classification_name) title = `${classification[0].classification_name} vehicles`;

        else {
            res.redirect('/');
            return;
        }
    }

    res.render('./inventory/classification', { title, nav, grid, res });
};

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description build inventory item by ID view
 */
invCont.buildByVehicleId = async (req, res, next) => {
    const vehicle_id = req.params.vehicleId;
    const data = await invModel.getInventoryById(vehicle_id);
    const pageData = await utilities.buildInventoryPage(data.rows[0]);
    const title = pageData[0];
    const page = pageData[1];
    const nav = await utilities.getNav();
    res.render('./inventory/detail', { title, nav, page });
}

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description cause an error
 */
invCont.ouch = async (req, res, next) => next(new Error('ouch'));

module.exports = invCont;
