const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const route = require('../router/routers');
const session = require('express-session');
const flash = require('connect-flash');
const mongoose = require('mongoose');

const app = express();

dotenv.config();

mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected successfully'))
    .catch((err) => console.log('MongoDB connection error:', err));

global.loggedIn = null;
global.loggedUser = null;

app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

app.use(express.urlencoded({
    extended: false
}));

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

app.use('*', (req, res, next) => {
    loggedIn = req.session.userId;
    loggedUser = req.session.userName;
    next();
});

app.use(express.static(path.join(__dirname, '../public')));
app.use(flash());

// log requests
app.use(morgan('tiny'));

app.use(route);

if (process.env.VERCEL === 'true') {
    module.exports = (req, res) => {
        app(req, res);
    };
} else {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}
