//#region dependencies
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const env = require('dotenv').config();
const app = express();

const staticContent = require('./routes/static');
const baseController = require('./controllers/baseController');
const inventoryRoute = require('./routes/inventoryRoute');
const utilities = require('./utilities/');
//#endregion

//#region layout
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', './layouts/layout');
//#endregion

//#region routes
/*
    ['/css', '/js', '/images']  => staticContent
    ['/', '/home']              => index
    '/inv'                      => inventoryRoute
    '/*'                        => 404 notFound (sets status/msg)
    '/*'                        => Error page
*/

app.use(staticContent);
app.get(['/', '/home'], utilities.handleErrors(baseController.buildHome));
app.use('/inv', inventoryRoute);
app.use(async (req, res, next) => next({ status: 404, message: 'Sorry, we appear to have lost that page.' }));

// express error handler **must be last middleware**
app.use(async (err, req, res, next) => {
    console.error(`Error at: "${req.originalUrl}": ${err.message}`);

    let dest = 'error';

    const destData = {
        title: err.status || 'Server Error',
        message: 'Oh no! There was a crash. Maybe try a different route?',
        nav: await utilities.getNav()
    }

    if(err.status === 404) {
        dest = 'notfound';
        destData.message = err.message;
        destData.path = req._parsedUrl.href;
    }

    res.render(`errors/${dest}`, destData);
});
//#endregion

//#region environment vars (.env)
const port = process.env.PORT;
const host = process.env.HOST;
//#endregion

//#region running confirmation
app.listen(port, () => console.log(`app listening on ${host}:${port}`));
//#endregion