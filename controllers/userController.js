const User = require("../models/User");
const bcrypt = require('bcrypt');

// User Login
const user_login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        req.flash('validationErrors', 'Please enter Username and Password');
        return res.redirect('/login');
    }

    try {
        const user = await User.findOne({ username });

        if (!user) {
            req.flash('validationErrors', 'Username is invalid');
            return res.redirect('/login');
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            req.flash('validationErrors', 'Password is incorrect');
            req.flash('username', username);
            return res.redirect('/login');
        }

        req.session.userId = user._id;
        req.session.userName = user.fullname;
        req.session.userRole = user.role;
        console.log(`Logged by user: ${user.fullname} at ${new Date()}`);
        res.redirect('/manage/product');
    } catch (error) {
        console.error(error);
        res.redirect('/login');
    }
};

// Log out
const logout = (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
};

// Insert user
const storeUser = async (req, res) => {
    const { fullname, email, username, password } = req.body;

    // Validate required fields
    if (!fullname || !email || !username || !password || password.length < 8) {
        req.flash('validationErrors', 'All fields are required, and password must be at least 8 characters.');
        req.flash('data', req.body);
        return res.redirect('/register');
    }

    try {
        const [emailExists, usernameExists] = await Promise.all([
            User.exists({ email }),
            User.exists({ username }),
        ]);

        if (emailExists || usernameExists) {
            if (emailExists) req.flash('validationErrors', 'This email address has been used.');
            if (usernameExists) req.flash('validationErrors', 'This username has been used.');
            req.flash('data', req.body);
            return res.redirect('/register');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({
            fullname,
            username,
            password: hashedPassword,
            email,
            registered_by: `${loggedUser} at ${new Date()}`,
        });

        req.flash('validationSuccess', 'User registered successfully.');
        return res.redirect('/manage/user');
    } catch (error) {
        console.error('Error storing user:', error);
        req.flash('validationErrors', 'An error occurred. Please try again.');
        return res.redirect('/register');
    }
};

// Delete user
const deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.redirect('/manage/user');
    } catch (error) {
        console.error(error);
    }
};

// User update info
const updateUser = async (req, res) => {
    const { fullname, email, username, cur_password, password, cfm_newpassword } = req.body;

    try {
        const currentUser = await User.findById(req.session.userId);
        if (!currentUser) {
            req.flash('validationErrors', 'User not found.');
            return res.redirect('/user/update');
        }

        const updates = { fullname, email, username, updated_by: loggedUser, updated_at: new Date() };
        let errors = "";

        if (email !== currentUser.email && (await User.exists({ email, _id: { $ne: currentUser._id } }))) {
            errors = `Email ${email} is already in use by other users.`;
        }
        if (username !== currentUser.username && (await User.exists({ username, _id: { $ne: currentUser._id } }))) {
            errors = `Username ${username} is already in use by other users.`;
        }

        if (password) {
            if (password.length < 8) {
                errors = 'Password must be at least 8 characters.';
            } else if (password !== cfm_newpassword) {
                errors = 'Passwords do not match.';
            } else if (!(await bcrypt.compare(cur_password, currentUser.password))) {
                errors = 'Current password is incorrect.';
            } else {
                updates.password = await bcrypt.hash(password, 10);
            }
        }

        if (errors) {
            req.flash('validationErrors', errors);
            return res.redirect('/user/update');
        }

        await User.findByIdAndUpdate(req.session.userId, updates);
        req.flash('validationSuccess', 'User updated successfully.');
        res.redirect('/manage/product');
    } catch (error) {
        console.error(error);
        res.redirect('/user/update');
    }
};

// Update user info by Admin
const admin_userUpdate = async (req, res) => {
    const { fullname, email, username, password, user_id } = req.body;

    try {
        const currentUser = await User.findById(user_id);
        if (!currentUser) {
            req.flash('validationErrors', 'User not found.');
            return res.redirect(`/admin/manage/user/${user_id}`);
        }

        const updates = { fullname, email, username, updated_by: loggedUser, updated_at: new Date() };
        let errors = "";

        if (email !== currentUser.email && (await User.exists({ email, _id: { $ne: currentUser._id } }))) {
            errors = `Email ${email} is already in use by other users.`;
        }
        if (username !== currentUser.username && (await User.exists({ username, _id: { $ne: currentUser._id } }))) {
            errors = `Username ${username} is already in use by other users.`;
        }

        if (password) {
            if (password.length < 8) {
                errors = 'Password must be at least 8 characters.';
            } else {
                updates.password = await bcrypt.hash(password, 10);
            }
        }

        if (errors) {
            req.flash('validationErrors', errors);
            return res.redirect(`/admin/manage/user/${user_id}`);
        }

        await User.findByIdAndUpdate(user_id, updates);
        req.flash('validationSuccess', 'User updated successfully.');
        res.redirect('/manage/user');
    } catch (error) {
        console.error(error);
        res.redirect(`/admin/manage/user/${user_id}`);
    }
};

// Form login
const form_login = (req, res) => {
    const username = req.flash('username')[0] || '';
    res.render('form_login_new', {
        errors: req.flash('validationErrors'),
        username,
    });
};

// Form register
const form_register = (req, res) => {
    const data = req.flash('data')[0] || {};
    const { fullname = '', email = '', role = '', username = '', password = '' } = data;

    res.render('form_register', {
        errors: req.flash('validationErrors'),
        success: req.flash('validationSuccess'),
        fullname,
        email,
        role,
        username,
        password,
    });
};

// Form update user
const form_updateUser = async (req, res) => {
    try {
        const user = await User.findOne({ _id: loggedIn });
        if (!user) {
            req.session.destroy(() => res.redirect('/login'));
        } else {
            res.render('form_updateUser', {
                errors: req.flash('validationErrors'),
                user,
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

// Form admin manage users
const form_manageUsers = async (req, res) => {
    try {
        const searchQuery = req.query.search;
        const user_id = req.params.id;
        const searchFilter = searchQuery
            ? {
                $or: [
                    { fullname: new RegExp(searchQuery, 'i') },
                    { email: new RegExp(searchQuery, 'i') },
                    { username: new RegExp(searchQuery, 'i') },
                ],
                _id: { $ne: loggedIn },
            }
            : { _id: { $ne: loggedIn } };

        const users = await User.find(searchFilter).sort({ fullname: 1 });

        if (req.originalUrl.includes('/manage/user')) {
            res.render('form_admin_manageUser', {
                users,
                success: req.flash('validationSuccess'),
            });
        } else if (req.originalUrl.includes(`/admin/manage/user/${user_id}`)) {
            const user = await User.findById(user_id);
            if (user) {
                res.render('form_admin_updateUser', {
                    errors: req.flash('validationErrors'),
                    user,
                });
            } else {
                res.status(404).send('User not found');
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

// Form admin update users
const form_admin_UpdateUser = async (req, res) => {
    try {
        const user_id = req.params.id;
        const user = await User.findById(user_id);

        if (user) {
            res.render('form_admin_updateUser', {
                errors: req.flash('validationErrors'),
                user,
                userRole,
            });
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    logout,
    form_login,
    form_register,
    form_updateUser,
    form_manageUsers,
    form_admin_UpdateUser,
    deleteUser,
    storeUser,
    user_login,
    updateUser,
    admin_userUpdate
};