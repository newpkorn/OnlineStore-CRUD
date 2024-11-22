const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = mongoose.Schema({
    fullname: {
        type: String,
        required: [true, 'Please provide fullname.']
    },
    username: {
        type: String,
        required: [true, 'Please provide username.']
    },
    password: {
        type: String,
        required: [true, 'Please provide password.']
    },
    email: {
        type: String,
        required: [true, 'Please provide password']
    },
    role: {
        type: String,
        default: 'user',
        required: [true, 'Please select role']
    },
    registered_by: {
        type: String,
        default: ''
    },
    updated_by: {
        type: String,
        default: ''
    },
    updated_at: {
        type: Date,
        default: ''
    }
});

UserSchema.pre('save', function(next) {

    const user = this;

    bcrypt.hash(user.password, 10).then((hash) => {
        user.password = hash;
        next();
    }).catch((error) => {
        console.error(error);
    });
});

const User = mongoose.model('User', UserSchema);

module.exports = User;