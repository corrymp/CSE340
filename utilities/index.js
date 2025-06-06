//#region dependencies
const invModel = require('../models/inventory-model');
const jwt = require('jsonwebtoken');
const fs = require('fs');
require('dotenv').config();
const Util = {};

const numFormatEnUS = new Intl.NumberFormat('en-us');
//#endregion dependencies

//#region universal
Util.lastModified = new Date(fs.statSync('./server.js').mtime).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'shortGeneric'
});

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
Util.getNav = async (req, res, next) => (
    `<ul>
                    <li><a href="/" title="Home page">Home</a></li>${(await invModel.getClassifications()).rows.map(row => `
                    <li><a href="/inv/type/${row.classification_id}" title="See our inventory of ${row.classification_name} vehicles">${row.classification_name}</a></li>`).join('')}
                </ul>`
);

const debounce = (fn, delay = 500) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    }
};

Util.unescape = str => str.replace(/(?:&amp;|&lt;|&gt;|&quot;|&#x27;|&#x60;)/g, i => ({ "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#x27;": "'", "&#x60;": "`" })[i]);

/**
 * @param {Function} fn - callback function to run
 * @returns {Promise}
 * @description attempts to run callback function, and catches errors that may arise
 */
Util.handleErrors = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

//#endregion universal

//#region build
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
Util.buildClassificationGrid = async data => data.length > 0
    ? `<ul id="inv-display">${data.map(v => `
                        <li><a href="../../inv/detail/${v.inv_id}" title="View ${v.inv_make} ${v.inv_model} details">
                            <img src="${v.inv_thumbnail}" alt="${v.inv_make} ${v.inv_model} available on CSE Motors">
                            <div class="namePrice">
                                <hr>
                                <h2>${v.inv_make} ${v.inv_model}</h2>
                                <span>$${Util.commaify(v.inv_price)}</span>
                            </div>
                        </a></li>`).join('')}
                    </ul>`
    : '<p class="notice">Sorry, no matching vehicles could be found.</p>';

/**
 * @param {String?} classification_id - id of classification to pre-select
 * @returns {String} build HTML string of "select" populated with "option"s
 */
Util.buildClassificationList = async classification_id => (
    `<select name="classification_id" id="classification_id" required>
                            <option value="" class="select-unused">Classification...</option>${(await invModel.getClassifications()).rows.map(row => `
                            <option ${classification_id === row.classification_id ? 'selected ' : ''}value="${row.classification_id}">${row.classification_name}</option>`).join('')}
                        </select>`
);

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
    `<div><img src="${invData.inv_image}" alt="${invData.inv_make} ${invData.inv_model} available on CSE Motors"></div>
                    <div>
                        <h2>${invData.inv_make} ${invData.inv_model} Details</h2>
                        <p><b>Price: $${Util.commaify(invData.inv_price)}</b></p>
                        <p><b>Description:</b> ${invData.inv_description}</p>
                        <p><b>Color:</b> ${invData.inv_color}</p>
                        <p><b>Miles:</b> ${Util.commaify(invData.inv_miles)}</p>
                    </div>`
];
//#endregion build

//#region auth
/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description verifies authenticity of JWT
 */
Util.checkJWTToken = (req, res, next) => {
    if (req.cookies.jwt) {
        if (process.env.NODE_ENV === 'development') displayToken(req.cookies.jwt);

        jwt.verify(
            req.cookies.jwt,
            process.env.ACCESS_TOKEN_SECRET,
            (err, accountData) => {
                if (err) {
                    req.flash('notice', 'Please log in');
                    res.clearCookie('jwt');
                    return res.redirect('/account/login');
                }
                res.locals.accountData = accountData;
                res.locals.loggedin = 1;
            }
        )
    }

    next();
};

Util.checkLogin = (req, res, next) => res.locals.loggedin ? next() : (req.flash('notice', 'Please log in.'), res.redirect('/account/login'));

const checkAccountType = (mustBe, req, res, next) => {
    const noPerms = (msg = 'You do not have permission to view this page.', home = false) => {
        req.flash('notice', msg);
        res.status(418).redirect(home ? '/' : '/account/login');
    }

    // set in Util.checkJWTToken
    const loggedIn = res.locals?.loggedin ?? false;

    // must not be logged in, is logged in => account view
    if (loggedIn === 1 && mustBe === null) return res.redirect('/account');

    if (loggedIn !== 1) {
        // must be logged in, is not logged in (should already be handled, but leaving it here juussstttt in case) => login view
        if (mustBe) return noPerms('You must be logged in to view this page.');

        // must not be logged in, is not logged in
        return next();
    }

    // set in Util.checkJWTToken
    const type = res.locals?.accountData?.account_type ?? null;

    // user is the required type
    if (mustBe === type) return next();

    // admin can access anything unless REQUIRED to be logged out
    if (type === 'Admin') return next();

    // employees can access client areas
    if (mustBe === 'Client' && type === 'Employee') return next();

    // everything else => login
    noPerms();

    /*
    be \ is|admin |staff |client| none
    -------+------+------+------+------
     admin | Pass | Fail | Fail | Fail
    -------+------+------+------+------
     staff | Pass | Pass | Fail | Fail
    -------+------+------+------+------
    client | Pass | Pass | Pass | Fail
    -------+------+------+------+------
      none | Fail | Fail | Fail | Pass
    */
};

Util.checkAdmin = (req, res, next) => checkAccountType('Admin', req, res, next);
Util.checkEmployee = (req, res, next) => checkAccountType('Employee', req, res, next);
Util.checkClient = (req, res, next) => checkAccountType('Client', req, res, next);
Util.checkLoggedOut = (req, res, next) => checkAccountType(null, req, res, next);

const displayToken = debounce(async token => {
    const [rawHeader, rawPayload, rawSignature] = token.split('.');
    const [parsedHeader, parsedBody] = [rawHeader, rawPayload].map(i => JSON.parse(atob(i)));
    const enc = new TextEncoder();

    const builtSignature = btoa(
        String.fromCharCode(
            ...new Uint8Array(
                await crypto.subtle.sign(
                    'HMAC',
                    await crypto.subtle.importKey('raw', enc.encode(process.env.ACCESS_TOKEN_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
                    enc.encode(`${rawHeader}.${rawPayload}`)
                )
            )
        )
    ).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    console.log(
        '\n==== TOKEN ====',
        '\n  Header:',  parsedHeader,
        '\n  Payload:', parsedBody,
        '\n  Match:',   rawSignature === builtSignature,
        '\n==== ENDTOKEN ===='
    );
});
//#endregion auth

module.exports = Util;
