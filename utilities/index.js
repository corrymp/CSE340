//#region dependencies
const invModel = require('../models/inventory-model');
const jwt = require('jsonwebtoken');
const fs = require('fs');
require('dotenv').config();
const Util = {};

const numFormatEnUS = new Intl.NumberFormat('en-us');
const displayTokens = false;
//#endregion dependencies

//#region universal

// in development: timestamp of last time main server file was saved
// in production:  timestamp of last time application was built
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
                    <li><a href="/" title="Home page">Home</a></li>${(await invModel.getAllClassifications()).rows.map(row => `
                    <li><a href="/inv/type/${row.classification_id}" title="See our inventory of ${row.classification_name} vehicles">${row.classification_name}</a></li>`).join('')}
                </ul>`
);

/**
 * @param {Function} fn - function to debounce
 * @param {Number} delay - delay in ms
 * @returns {Function} debounced function. passes all arguments on to originaly passed function 
 * @description a debounced function will wait a short time after being called before executing. resets wait if called again before wait is up
 */
const debounce = (fn, delay = 500) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    }
};

/**
 * @param {String} str - string to unescape
 * @returns {String} unescaped string
 * @author jashkenas
 * @description adapted from https://github.com/jashkenas/underscore
 * @copyright Copyright (c) 2009-2022 Jeremy Ashkenas, Julian Gonggrijp, and DocumentCloud and Investigative Reporters & Editors
 * @license 
Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
 */
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
 * @param {Object[]} data                - array containing rows from the inventory table of vehicles from a given classification
 * @param {String} data.inv_make         - vehicle make
 * @param {String} data.inv_model        - vehicle model
 * @param {String} data.inv_id           - vehicle id
 * @param {String} data.inv_thumbnail    - vehicle thumbnail image path
 * @param {String} data.inv_price        - vehicle price
 * @returns {String} built HTML string of vehicles grid
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
                            <option value="" class="select-unused">Classification...</option>${(await invModel.getAllClassifications()).rows.map(row => `
                            <option ${classification_id === row.classification_id ? 'selected ' : ''}value="${row.classification_id}">${row.classification_name}</option>`).join('')}
                        </select>`
);

/**
 * @param {Object} data                 - data to build page from
 * @param {String} data.inv_year        - vehicle year
 * @param {String} data.inv_make        - vehicle make
 * @param {String} data.inv_model       - vehicle model
 * @param {String} data.inv_image       - vehicle image
 * @param {String} data.inv_price       - vehicle price
 * @param {String} data.inv_description - vehicle deription
 * @param {String} data.inv_color       - vehicle color
 * @param {String} data.inv_miles       - vehicle milage
 * @returns {String[]} page title and contents
 */
Util.buildInventoryDetailsView = async data => [
    `${data.inv_year} ${data.inv_make} ${data.inv_model}`,
    `<div><img src="${data.inv_image}" alt="${data.inv_make} ${data.inv_model} available on CSE Motors"></div>
                    <div>
                        <h2>${data.inv_make} ${data.inv_model} Details</h2>
                        <p><b>Price: $${Util.commaify(data.inv_price)}</b></p>
                        <p><b>Description:</b> ${data.inv_description}</p>
                        <p><b>Color:</b> ${data.inv_color}</p>
                        <p><b>Miles:</b> ${Util.commaify(data.inv_miles)}</p>
                    </div>`
];

Util.buildInventoryList = async invRows => invRows.length > 0 
? `<h3>Items that will also be deleted if you proceed:</h3>
<table id="itemsToRemove">
    <thead>
        <tr>
            <th>Make</th>
            <th>Model</th>
            <th>Price</th>
            <th>Year</th>
        </tr>
    </thead>
    <tbody>${invRows.map(row=>`
        <tr>
            <td>${row.inv_make}</td>
            <td>${row.inv_model}</td>
            <td>$${Util.commaify(row.inv_price)}</td>
            <td>${row.inv_year}</td>
        </tr>`).join('')}
    </tbody>
</table>`
: '<p>There are no items under this classification.</p>';

/**
 * @param {String?} acount_type - account type to pre-select
 * @returns {String} build HTML string of "select" populated with "option"s
 */
Util.buildAccountTypeList = (all, account_type) => (
    `<select name="account_type" id="accountType" required>
                            <option value="" class="select-unused">Account type...</option>${['Admin', 'Employee', 'Client',
                                ...(all ? ['All'] : [])
                            ].map(type => `
                            <option ${account_type === type ? 'selected ' : ''}value="${type}">${type}</option>`).join('')}
                        </select>`
);

//#endregion build

//#region auth

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description verifies authenticity of JWT; pass: calls next function; else: redirect to login
 */
Util.checkJWTToken = (req, res, next) => {
    if (req.cookies.jwt) {
        if (displayTokens && process.env.NODE_ENV === 'development') displayToken(req.cookies.jwt);

        jwt.verify(
            req.cookies.jwt,
            process.env.ACCESS_TOKEN_SECRET,
            (err, accountData) => {
                if (err) {
                    req.flash('notice', 'Please log in');
                    res.clearCookie('jwt');
                    return res.status(401).redirect('/account/login');
                }
                res.locals.accountData = accountData;
                res.locals.loggedin = 1;
            }
        )
    }

    next();
};

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description checks login status of request; pass: calls next function; else: redirects to login
 */
Util.checkLogin = (req, res, next) => res.locals.loggedin ? next() : (req.flash('notice', 'Please log in.'), res.status(401).redirect('/account/login'));

//#region account type

/**
 * @param {String} mustBe - type of account to check for
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description validates that a user has the required login status or account type:
 * - if required to be logged in and not logged in: redirect to login;
 * - else if required to not be logged in and is logged in: redirects to account page;
 * - else if is required account type: calls next function;
 * - else if is admin: calls next function;
 * - else if required type is client and auser is employee: calls next function;
 * - else: redirects to login page
 */
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

        // must not be logged in, is not logged in => next
        return next();
    }

    // set in Util.checkJWTToken
    const type = res.locals?.accountData?.account_type ?? null;

    // user is the required type => next
    if (mustBe === type) return next();

    // admin can access anything unless REQUIRED to be logged out => next
    if (type === 'Admin') return next();

    // employees can access client areas => next
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

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description checks that user is an admin
 */
Util.checkAdmin = (req, res, next) => checkAccountType('Admin', req, res, next);

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description checks that user is an employee
 */
Util.checkEmployee = (req, res, next) => checkAccountType('Employee', req, res, next);

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description checks that user is a client
 */
Util.checkClient = (req, res, next) => checkAccountType('Client', req, res, next);

/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next callback
 * @description checks that user is logged out
 */
Util.checkLoggedOut = (req, res, next) => checkAccountType(null, req, res, next);

//#endregion account type

/**
 * **only for use in development builds**
 * @param {jwt} token - JSON Web Token to display parsed contents of
 * @description debounced to prevent console spam when loading content
 */
const displayToken = debounce(
    async token => {
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
        '\n  Header:', parsedHeader,
        '\n  Payload:', parsedBody,
        '\n  Match:', rawSignature === builtSignature,
        '\n==== ENDTOKEN ===='
    );
});
//#endregion auth

module.exports = Util;
