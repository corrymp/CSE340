//#region dependencies
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');

const pool = require('./database');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

require('dotenv').config();

const app = express();

//#region routers
const staticContent = require('./routes/static');
const baseController = require('./controllers/baseController');
const accountRoute = require('./routes/accountRoute');
const inventoryRoute = require('./routes/inventoryRoute');
const utilities = require('./utilities/');
//#endregion routers

//#endregion dependencies

//#region middleware

// session
app.use(session({
    store: new (require('connect-pg-simple')(session))({ createTableIfMissing: true, pool }),
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    name: 'sessionId'
}));

// Express Messages
app.use(require('connect-flash')());
app.use((req, res, next) => {
    res.locals.messages = require('express-messages')(req, res);
    next();
});

// for forms
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// for auth
app.use(cookieParser());
app.use(utilities.checkJWTToken);

//#endregion middleware

//#region layout
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', './layouts/layout');
//#endregion

//#region routes

/*
    ['/css', '/js', '/images']  => staticContent
    ['/', '/home']              => index
    '/account'                  => accountRoute
    '/inv'                      => inventoryRoute
    '/*'                        => 404 notFound (sets status/msg)
    '/*'                        => Error page
*/

app.use(utilities.handleErrors(staticContent));
app.get(['/', '/home'], utilities.handleErrors(baseController.homeView));
app.use('/account', utilities.handleErrors(accountRoute));
app.use('/inv', utilities.handleErrors(inventoryRoute));
app.use(async (req, res, next) => next({ status: 404, message: `Uh, idk where that page went, but it isn't here` }));

// express error handler **must be last middleware**
app.use(async (err, req, res, next) => {
    console.error(`Error at: "${req.originalUrl}": ${err.message}`);

    let dest = 'error';

    const destData = {
        title: err.status || 'Internal Server Error',
        message: 'Ouch, something broke over here... Try a different route?',
        nav: await utilities.getNav(),
        lastModified: utilities.lastModified
    };

    if (err.status === 404) {
        dest = 'notfound';
        destData.message = err.message;
        destData.path = req._parsedUrl.href;
    }

    res.status(err.status || 500).render(`errors/${dest}`, destData);
});

//#endregion routes

//#region environment vars (.env)
const port = process.env.PORT;
const host = process.env.HOST;
//#endregion

//#region running confirmation
app.listen(port, () => console.log(`app listening on ${host}:${port}`));
//#endregion
