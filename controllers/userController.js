const User = require("../models/User");
const bcrypt = require('bcrypt')

// User Login
const user_login = (req, res) => {
    const { username, password } = req.body

    if (username && password) {
        User.findOne({ username: username }).then((user) => {
            // console.log(user)

            if (user) {
                bcrypt.compare(password, user.password).then((match) => {
                    if (match) {

                        console.log(`Logged by user : ${user.fullname} at ${new Date()}`);

                        req.session.userId = user._id
                        req.session.userName = user.fullname
                        res.redirect('/manage/product')
                    } else {
                        const validationErrors = 'Password is incorrect'
                        console.log(validationErrors);

                        req.flash('validationErrors', validationErrors)
                        req.flash('username', req.body.username)

                        res.redirect('/login')
                    }
                })
            } else {
                const validationErrors = 'Username is invalid'
                console.log(validationErrors);

                req.flash('validationErrors', validationErrors)
                res.redirect('/login')
            }
        })
    }else {
        const validationErrors = 'Please enter Username and Password'
        console.log(validationErrors);

        req.flash('validationErrors', validationErrors)
        res.redirect('/login')
    }
}

// Log out
const logout = (req, res) => {
    req.session.destroy(() => {
        return res.redirect('/login');
    });
}

// ================ CRUD =============== //
// Insert user
const storeUser = async (req, res) => {
    
    const { email, username, password } = req.body;

    let errors = "";

    try {
        const users = await User.find();

        if (users) {
            // Checking if an email or username is already in use.
            const usedEmails = users.map((user) => user.email);
            const usedUsernames = users.map((user) => user.username);

            if (usedEmails.includes(email)) {
                errors = "This email address has been used.";
            }else if (usedUsernames.includes(username)) {
                errors = "This username has been used.";
            }else if (password !== "" && password.length < 8) {
                errors = "The password must contain at least 8 characters.";
            }
        }

        if (errors) {
            console.log(errors);

            req.flash('validationErrors', errors);
            req.flash('data', req.body);

            return res.redirect('/register');
        }

        // User not found, so create a new user.
        const newUser = new User({
            fullname: req.body.fullname,
            username: req.body.username,
            password: req.body.password,
            email: req.body.email,
            registered_by: loggedUser + " at " + new Date()   // Set updated_by using the global variable
        })
        User.create(newUser).then((userCreated) => {
            if (userCreated) {
                console.log('User registered successfully.');

                console.log('Registered by: '+ loggedIn+" : "+ loggedUser,);

                const validationSuccess = 'User registered successfully.';
                req.flash('validationSuccess', validationSuccess);

                return res.redirect('/manage/user')
            }
        }).catch((error) => {
            // console.log(error.errors);

            const validationErrors = Object.keys(error.errors).map(key => error.errors[key].message);
            req.flash('validationErrors', validationErrors);
            req.flash('data', req.body);

            return res.redirect('/register');
            
        });

    } catch (error) {
        console.error(error);
    }
}

// Delete user
const deleteUser = (req, res) => {
    User.findByIdAndDelete(req.params.id).then(() => {
        return res.redirect('/manage/user');
    }).catch(error => console.log(error));
}

// User update info
const updateUser = async (req, res) => {

    const { fullname, email, username, cur_password, password, cfm_newpassword } = req.body

    let errors = ""
    let usr_update = {}

    try {
        // Get the current user's data from the database
        const currentUser = await User.findById(req.session.userId)

        if (currentUser) {
            // Check if an email or username is different from the current email and username
            const isEmailChanged = email !== currentUser.email
            const isUsernameChanged = username !== currentUser.username

            // If email or username is changed, perform validation checks excluding the current user's data
            if (isEmailChanged || isUsernameChanged) {

                // Check if the email is already in use by other users excluding the current user
                const emailExists = await User.exists({ email: email, _id: { $ne: currentUser._id } })

                if (emailExists) {
                    errors = `Email ${email} is already in use by other users`
                }

                // Check if the username is already in use by other users excluding the current user
                const usernameExists = await User.exists({ username: username, _id: { $ne: currentUser._id } })

                if (usernameExists) {
                    errors = `Username ${username} is already in use by other users`
                }

            }

            if (password === "" && cfm_newpassword === "") {
                if (cur_password !== "") {
                    const isPasswordMatch = await bcrypt.compare(cur_password, currentUser.password)
                    if (isPasswordMatch) {
                        usr_update = {
                            fullname: fullname,
                            email: email,
                            username: username,
                            updated_by: loggedUser,
                            updated_at: new Date()
                        }
                    }else {
                        errors = "Password incorrect"
                    }
                }else {
                    errors = "Current password is required"
                }
            }
            else if (req.body != {}) {
                if (cur_password != "") {

                    const match = await bcrypt.compare(cur_password, currentUser.password)
                    if (match) {

                        console.log('Password matched')
                        if (password != "") {
                            console.log('current password : ' + cur_password)
                            console.log('new password : ' + password)

                            if (cur_password != password) {
                                if (cfm_newpassword != "") {
                                    if (password == cfm_newpassword) {
                                        if (password.length >= 8 && cfm_newpassword.length >= 8) {
                                            const new_password = await bcrypt.hash(password, 10)
                                            usr_update = {
                                                fullname: fullname,
                                                email: email,
                                                username: username,
                                                password: new_password,
                                                updated_by: loggedUser,
                                                updated_at: new Date()
                                            }

                                            console.log('--------------- Update Password ---------------')
                                            console.log('New password confirmed')
                                            console.log('-----------------------------------------------')
                                        }else {
                                            console.log('--------------- Update Password ---------------')
                                            console.log('Password must be contained at least 8 characters')
                                            console.log('-----------------------------------------------')

                                            errors = 'Password must be contained at least 8 characters'
                                        }
                                    } else {
                                        console.log('--------------- Update Password ---------------')
                                        console.log('New password and confirm password does not match')
                                        console.log('-----------------------------------------------')

                                        errors = 'New password and confirm password does not match'
                                    }
                                } else {
                                    console.log('--------------- Update Password ---------------')
                                    console.log('Please confirm new password')
                                    console.log('-----------------------------------------------')

                                    errors = 'Please confirm new password'
                                }
                            } else {
                                console.log('--------------- Update Password ---------------')
                                console.log('Your new password is the same as the current one, please change it.')
                                console.log('-----------------------------------------------')

                                errors = 'Your new password is the same as the current one, please change it.'

                            }
                        } else {
                            console.log('--------------- Update Password ---------------')
                            console.log('Please provide a new password.')
                            console.log('-----------------------------------------------')

                            errors = 'Please provide a new password.'
                        }
                    } else {
                        console.log('--------------- Update Password ---------------')
                        console.log('You current password is incorrect')
                        console.log('-----------------------------------------------')

                        errors = 'You current password is incorrect'
                    }
                }
            }

            if (errors) {
                console.log(errors)

                req.flash('validationErrors', errors)
                return res.redirect('/user/update')
            }else {
                const updated = await User.findByIdAndUpdate(req.session.userId, usr_update)
                if (updated) {

                    console.log('----------------- Update User -----------------')
                    console.log('The user was updated')
                    console.log('-----------------------------------------------')

                    console.log(updated);

                    const validationSuccess = 'The user was updated'
                    req.flash('validationSuccess', validationSuccess)

                    return res.redirect('/manage/product')
                }else {
                    return res.redirect('/user/update')
                }
            }
            
        }
    } catch (error) {
        console.log(error)
    }
}

// Update user info by Admin
const admin_userUpdate = async (req, res) => {
    
    const { fullname, email, username, password } = req.body;

    let errors = '';
    let usr_update = '';

    try {
        // Get the current user's data from the database
        const currentUser = await User.findOne({_id: req.body.user_id});
        if (currentUser) {
            // Check if an email or username is different from the current email and username
            const isEmailChanged = email !== currentUser.email;
            const isUsernameChanged = username !== currentUser.username;

            // If email or username is changed, perform validation checks excluding the current user
            if (isEmailChanged || isUsernameChanged) {

                // Check if the email is already in use by other users excluding the current user
                const emailExists = await User.exists({email: email, _id: { $ne: currentUser._id}});
                // Check if the username is already in use by other users excluding the current user
                const usernameExists = await User.exists({username: username, _id: { $ne: currentUser._id}});

                if (emailExists) {
                    errors = `Email ${email} is already in use by other users`;
                    // console.log(errors);
                }
                
                if (usernameExists) {
                    errors = `Username ${username} is already in use by other users`;
                    // console.log(errors);
                }

            }

            if (password !== '' && password.length < 8) {
                errors = 'Password must contain at least 8 charecters.';
                console.log(password);
                console.log(password.length);
                // console.log(errors);
            }
            else if (password === '') {
                usr_update = {
                    fullname: fullname,
                    email: email,
                    username: username,
                    updated_by: loggedUser,
                    updated_at: new Date()
                }
                // console.log(usr_update);
            }else {

                const newPassword = await bcrypt.hash(password, 10);
                usr_update = {
                    fullname: fullname,
                    email: email,
                    username: username,
                    password: newPassword,
                    updated_by: loggedUser,
                    updated_at: new Date()
                }
                // console.log(usr_update);
            }
        }
        if (errors) {
            console.log(errors);

            req.flash('validationErrors', errors)
            return res.redirect(`/admin/manage/user/${currentUser._id}`)
        }else {
            console.log('Perform to user update');
            console.log(req.body.user_id);
            console.log(usr_update);

            // Perform user update
            const userUpdate = await User.findByIdAndUpdate(req.body.user_id, usr_update);
            if (userUpdate) {
                console.log('The user was updated');

                const success = `The user: ${req.body.fullname} was updated successfully.`;
                req.flash('validationSuccess', success);

                return res.redirect('/manage/user');
            }else {
                console.log('The user could not updated!!');
                return res.redirect('/manage/user');
            }
        }
    } catch (error) {
        console.log(error);
    }
}

// ================ Rendering Forms =============== //
// Form login
const form_login = (req, res) => {

    let username = "";
    let data = req.flash('username');

    if(data != null){
        username = data;
    }

    res.render('form_login_new',{
        errors: req.flash('validationErrors'),
        username: username
    });
}

// Form register
const form_register = (req, res) => {

    let fullname = ""
    let email = ""
    let username = ""
    let password = ""
    let data = req.flash('data')[0];

    if(typeof data != "undefined") {
        fullname = data.fullname
        email = data.email
        username = data.username
        password = data.password
    }
    
    res.render('form_register', {
        errors: req.flash('validationErrors'),
        success: req.flash('validationSuccess'),
        fullname: fullname,
        email: email,
        username: username,
        password: password
    });
}

// Form update user
const form_updateUser = (req, res) => {
    User.findOne({ _id: loggedIn }).then((user) => {
        if (user) {
            res.render('form_updateUser', {
                errors: req.flash('validationErrors'),
                user
            });
        }else {
            req.session.destroy((error) => {
                return res.redirect('/login');
            });
        }
    }).catch((error) => {
        console.error(error);
    });
}

// Form admin manage users
const form_manageUsers = (req, res) => {
    const searchQuery = req.query.search; // Get the search query parameter
    const user_id = req.params.id;
    let searchFilter = {}; // Initialize an empty filter

    if (searchQuery) {
        // If search query is provided, create a filter to search by fullname, email, or username
        searchFilter = {
            $or: [
                { fullname: new RegExp(searchQuery, "i") },
                { email: new RegExp(searchQuery, "i") },
                { username: new RegExp(searchQuery, "i") }
            ]
        };
        // Exclude the current logged-in user from the search results
        searchFilter._id = { $ne: loggedIn };
    } else {
        // If no search query, exclude only the current logged-in user
        searchFilter = { _id: { $ne: loggedIn } };
    }

    // Find all users based on the search filter
    User.find(searchFilter).sort({ fullname: 1 }).then((users) => {

        if (req.originalUrl.includes("/manage/user")) {
            // If accessed via search, render 'form_admin_manageUser'
            res.render('form_admin_manageUser', {
                users,
                success: req.flash('validationSuccess')
            });
        } else if (req.originalUrl.includes("/admin/manage/user/" + user_id)) {
            // If accessed via direct user link, render 'form_admin_updateUser'

            // Find the user to be edited
            User.findById(user_id).then((user) => {
                if (user) {
                    res.render('form_admin_updateUser', {
                        errors: req.flash('validationErrors'),
                        user
                    });
                }
            }).catch(error => console.log(error));
        }
    }).catch(error => console.log(error));
}

// Form admin update users
const form_admin_UpdateUser = (req, res) => {
    const user_id = req.params.id;
    
    User.findById(user_id).then((user) => {
        if (user) {
            res.render('form_admin_updateUser', {
                errors: req.flash('validationErrors'),
                user
            });
        }
    }).catch(error => console.log(error));
}

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
}