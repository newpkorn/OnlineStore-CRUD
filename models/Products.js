const mongoose = require('mongoose');

let productSchema = mongoose.Schema({
    name: String,
    price: Number,
    description: String,
    imagePath: String,
    added_by: { type: String, default: ''},
    updated_by: {type: String, default: ''},
    updated_at: {type: Date, default: ''}
});

let Product = mongoose.model('product_items', productSchema);

module.exports = Product;