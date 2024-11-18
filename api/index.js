const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const route = require('../router/routers');
const session = require('express-session');
const flash = require('connect-flash');
const mongoose = require('mongoose');

const app = express();

// โหลด environment variables
dotenv.config({ path: 'config.env' });

const conStr = process.env.MONGODB_URL;

// การเชื่อมต่อ MongoDB
mongoose.connect(conStr, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Database connected successfully');
}).catch(error => console.log('MongoDB Connection Error:', error));

global.loggedIn = null;
global.loggedUser = null;

// กำหนด views และ engine
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

// กำหนด session
app.use('*', (req, res, next) => {
    loggedIn = req.session.userId;
    loggedUser = req.session.userName;
    next();
});

app.use(express.static(path.join(__dirname, '../public')));
app.use(flash());

// log requests
app.use(morgan('tiny'));

// ใช้ router
app.use(route);

// การกำหนดการฟังพอร์ต
if (process.env.VERCEL === 'true') {
    // สำหรับ Vercel ให้ใช้แบบ serverless (ไม่มีการฟังพอร์ต)
    module.exports = (req, res) => {
        app(req, res);
    };
} else {
    // สำหรับ Local ให้ฟังพอร์ต 3000
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}
