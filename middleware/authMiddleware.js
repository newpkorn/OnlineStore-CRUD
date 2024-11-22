const User = require("../models/User");


const authMiddleware = (req, res, next) => {
    User.findById(req.session.userId).then((user) => {
        if (!user) {
            return res.redirect('/login');
        }
        next();
    }).catch(error => console.log(error));
}

const authByAdmin = (req, res, next) => {
    if (userRole !== 'admin') {
        return res.redirect('/manage/product');
    }
    console.log('logged in by admin');
    next();
}

const redirectIfAuth = (req, res, next) => {
    if (req.session.userId) {
        return res.redirect('/manage/product');
    }
    next();
}

module.exports = {
    authMiddleware,
    authByAdmin,
    redirectIfAuth
}
