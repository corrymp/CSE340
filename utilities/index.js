const invModel = require('../models/inventory-model');
const Util = {};

const numFormatEnUS = new Intl.NumberFormat('en-us');

/**
 * @param {Number} number - number to add commas to
 * @returns {String} number with commas inserted and rounded to 2 decimal places
 */
Util.commaify = n => numFormatEnUS.format(n);

/*
I made this after my adderall wore off and I must conclude that I am insane 
it's 211 characters with spaces removed (251 with)

Update: it is the next day and I just realized this already exists and **I already used it**: `Intl.NumberFormat('en-us)`
This is so sad Alexa play despacito

(Still keeping the code here though, I spent like 4 hours on it)
Util.commaify = n => (i => (l => (d => `${l ? `${i.substring(0, l)},` : ''}${i.substring(l).replace(/(\d{3})(?=\d)/g, '$1' + ',')}${+d ? `.${d < 10 ? d : d / (d % 10 ? 1 : 10)}` : ``}`)(Math.abs(n - i).toFixed(2).slice(2)))(i.length % 3))(parseInt((+n).toFixed(2)) + '');
*/

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
 * @param {Object[]} invData - rows from SQL query containing vehicles by classification
 * @param {String} invData.inv_make - vehicle make
 * @param {String} invData.inv_model - vehicle model
 * @param {String} invData.inv_id - vehicle id
 * @param {String} invData.inv_thumbnail - vehicle thumbnail image path
 * @param {String} invData.inv_price - vehicle price
 * @returns {String} built HTML string of vehicles grid
 * @description build the classification view HTML
 */
Util.buildClassificationGrid = async data => {
    let grid;

    if (data.length > 0) {
        grid = '<ul id="inv-display">';

        data.forEach(vehicle => {
            const makeModel = `${vehicle.inv_make} ${vehicle.inv_model}`;
            const viewLinkData = `href="../../inv/detail/${vehicle.inv_id}" title="View ${makeModel} details"`;

            grid += `
                        <li>
                            <a ${viewLinkData}>
                                <img src="${vehicle.inv_thumbnail}" alt="${makeModel} available on CSE Motors">
                                <div class="namePrice">
                                    <hr>
                                    <h2>${makeModel}</h2>
                                    <span>$${Util.commaify(vehicle.inv_price)}</span>
                                </div>
                            </a>
                        </li>`;
        });

        grid += `\n                    </ul>`;
    }
    else grid = '<p class="notice">Sorry, no matching vehicles could be found.</p>';

    return grid;
};

/**
 * @param {Object} invData - data to build page from
 * @param {String} invData.inv_year - vehicle year
 * @param {String} invData.inv_make - vehicle make
 * @param {String} invData.inv_model - vehicle model
 * @param {String} invData.inv_image - vehicle image
 * @param {String} invData.inv_price - vehicle price
 * @param {String} invData.inv_description - vehicle deription
 * @param {String} invData.inv_color - vehicle color
 * @param {String} invData.inv_miles - vehicle milage
 * @returns {String[]} page title and contents
 */
Util.buildInventoryPage = async invData => [
    `${invData.inv_year} ${invData.inv_make} ${invData.inv_model}`,
                   `<div>
                        <img src="${invData.inv_image}" alt="${invData.inv_make} ${invData.inv_model} available on CSE Motors">
                    </div>

                    <div>
                        <h2>${invData.inv_make} ${invData.inv_model} Details</h2>
                        <p><b>Price: $${Util.commaify(invData.inv_price)}</b></p>
                        <p><b>Description:</b> ${invData.inv_description}</p>
                        <p><b>Color:</b> ${invData.inv_color}</p>
                        <p><b>Miles:</b> ${Util.commaify(invData.inv_miles)}</p>
                    </div>`
];

/**
 * @param {Function} fn - callback function to run
 * @returns {Promise}
 * @description attempts to run callback function, and catches errors that may arise
 */
Util.handleErrors = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = Util;
