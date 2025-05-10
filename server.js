/* Require Statements */
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const env = require('dotenv').config();
const app = express();
const staticContent = require('./routes/static');

/* Layout */
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', './layouts/layout');

/* Routes: {static}, [/, /home], 404 fallback */
app.use(staticContent);
app.get(['/', '/home'], (req, res) => res.render('index', {title: 'Home'}));
app.get(/\/.+/, (req, res) => res.render('notfound', {title: 'Page Not Found', path: req._parsedUrl.href}));

/* Local Server Information Values from .env (environment) file */
const port = process.env.PORT;
const host = process.env.HOST;

/* Log statement to confirm server operation */
app.listen(port, () => console.log(`app listening on ${host}:${port}`));
