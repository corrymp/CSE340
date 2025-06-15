//#region dependencies
const utilities = require('../utilities/');
const baseController = {};
//#endregion dependencies

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @description renders home page view
 */
baseController.homeView = async (req, res) => res.render('index', { title: 'Home', nav: await utilities.getNav(), errors: null, lastModified: utilities.lastModified });

module.exports = baseController;
