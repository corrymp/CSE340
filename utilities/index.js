const invModel = require('../models/inventory-model');
const Util = {};

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @returns {String} built page navigation
 * @description Constructs the nav HTML unordered list
 */
Util.getNav = async (req, res, next) => {
    const data = await invModel.getClassifications();

    let list = `<ul>\n                    <li><a href="/" title="Home page">Home</a></li>`;

    data.rows.forEach(row => list += `
                    <li><a href="/inv/type/${row.classification_id}" title="See our inventory of ${row.classification_name} vehicles">${row.classification_name}</a></li>`
    );

    list += `\n                </ul>`;

    return list;
};

/**
 * @param {Object[]} data - rows from SQL query containing vehicles by classification
 * @param {String} data.inv_make - vehicle make
 * @param {String} data.inv_model - vehicle model
 * @param {String} data.inv_id - vehicle id
 * @param {String} data.inv_thumbnail - vehicle thumbnail image path
 * @param {String} data.inv_price - vehicle price
 * @returns {String} built HTML string of vehicles grid
 * @description build the classification view HTML
 */
Util.buildClassificationGrid = async (data) => {
    let grid;

    if (data.length > 0) {
        grid = '<ul id="inv-display">';

        data.forEach(vehicle => {
            const makeModel = `${vehicle.inv_make} ${vehicle.inv_model}`;
            const viewLinkData = `href="../../inv/detail/${vehicle.inv_id}" title="View ${makeModel} details"`;

            grid += `
                        <li>
                            <a ${viewLinkData}><img src="${vehicle.inv_thumbnail}" alt="Image of ${makeModel} on CSE Motors"></a>
                            <div class="namePrice">
                                <hr>
                                <h2><a ${viewLinkData}>${makeModel}</a></h2>
                                <span>$${new Intl.NumberFormat('en-us').format(vehicle.inv_price)}</span>
                            </div>
                        </li>`;
        });

        grid += `\n                    </ul>`;
    }
    else grid = '<p class="notice">Sorry, no matching vehicles could be found.</p>';

    return grid;
};

/**
 * @param {Function} fn - callback function to run
 * @returns {Promise}
 * @description attempts to run callback function, and catches errors that may arise
 */
Util.handleErrors = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = Util;
