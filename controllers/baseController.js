const utilities = require('../utilities/');
const baseController = {};

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @description renders home page view
 */
baseController.buildHome = async (req, res) => {
    const nav = await utilities.getNav();
    res.render('index', { title: 'Home', nav });
};

module.exports = baseController;
