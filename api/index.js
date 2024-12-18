const express = require('express');
require('dotenv').config();
const morgan = require('morgan');
const path = require('path');
const route = require('../router/routers');
const session = require('express-session');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');

const app = express();

mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected successfully'))
    .catch((err) => console.log('MongoDB connection error:', err));

global.loggedIn = null;
global.loggedUser = null;
global.userRole = null;

app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

app.use(express.urlencoded({
    extended: false
}));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URL,
        collectionName: 'sessions'
    }),
    cookie: {
        maxAge: 24 * 60 * 60 * 1000 // 1 day expiration
    }
}));

app.use('*', (req, res, next) => {
    loggedIn = req.session.userId;
    loggedUser = req.session.userName;
    userRole = req.session.userRole;
    next();
});

app.use(express.static(path.join(__dirname, '../public')));
app.use(flash());

// log requests
app.use(morgan('tiny'));

app.use(express.static(path.join(__dirname, '../public')));
app.use(flash());

// log requests
app.use(morgan('tiny'));

app.use(route);

app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'self'; font-src 'self' https://fonts.googleapis.com");
    next();
});  

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