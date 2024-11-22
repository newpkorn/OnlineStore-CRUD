const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) return res.redirect('/login');
        next();
    } catch (error) {
        console.error('Error in authMiddleware:', error);
        res.redirect('/login');
    }
};

const authByAdmin = (req, res, next) => {
    if (userRole !== 'admin') {
        return res.redirect('/manage/product');
    }
    console.log('Logged in by admin');
    next();
};

const redirectIfAuth = (req, res, next) => {
    if (req.session.userId) {
        return res.redirect('/manage/product');
    }
    next();
};

module.exports = {
    authMiddleware,
    authByAdmin,
    redirectIfAuth,
};