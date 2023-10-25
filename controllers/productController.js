const Product = require("../models/Products");
const User = require("../models/User");
const mongoose = require('mongoose');
const fs = require('fs');


// ================ CRUD =============== //
// Insert Product
const insertProduct = (req, res) => {

    const doc = new Product({
        name: req.body.name,
        price: req.body.price,
        description: req.body.details,
        imagePath: req.file.filename,
        added_by: loggedUser + " at " + new Date()
    });

    doc.save().then(() => {
        return res.redirect('/manage/product')
    }).catch((error) => {
        console.log(error);
    });

}

// Update Product
const updateProduct = async (req, res) => {
    const { product_id, name, price, details } = req.body;
    const image = req.file; // Get the uploaded image file
    let validationSuccess = '';

    if (!mongoose.Types.ObjectId.isValid(product_id)) {
        console.log('Invalid product ID');
        return res.redirect('/manage/product');
    }

    // Step 1: Retrieve the old image path from the database
    const product = await Product.findById(product_id);
    const currentImagePath = product.imagePath;

    console.log('Current image name : ' + currentImagePath);

    try {
        // Step 2: Delete the old image
        if ( image !== undefined ) {
            console.log(image);

            if (currentImagePath) {
                try {
                    await fs.promises.unlink('./public/images/products/' +currentImagePath);
                    console.log(`Old image name: "${currentImagePath}" was deleted successfully`);
                } catch (error) {
                    console.error('Error deleting old image:', error);
                }
            }
            console.log(`New image name: "${image.filename}" is preparing to update ...`);
        }
        
        const updatedProduct = await Product.findByIdAndUpdate(
            product_id,
            {
                name: name,
                price: price,
                description: details,
                imagePath: image ? image.filename : undefined, // Update the image field if an image is uploaded
                updated_by: loggedUser + " at " + new Date(),
                updated_at: new Date()
            },
            { new: true }
        );

        if (!updatedProduct) {
            console.log('Product not found');
            return res.redirect('/manage/product');
        }

        console.log('Product updated successfully');
        console.log(updatedProduct);

        validationSuccess = `Product name ${name} was updated successfully`;
        req.flash('validationSuccess', validationSuccess);
        return res.redirect('/manage/product');
    } catch (error) {
        console.log('Error updating product:', error);
        return res.redirect('/manage/product');
    }
}

// Delete Product
const deleteProdoctById = async (req, res) => {
    const product_id = req.params.id;
    let validationSuccess = '';
    try {
        const product = await Product.findById(product_id);
        if (product) {
            const imagePath = product.imagePath; // Get the image path from the product
            if (imagePath) {
                // Delete the image file from the filesystem
                fs.unlinkSync('./public/images/products/' + imagePath);
            }

            await Product.findByIdAndDelete(product_id, { useFindAndModifiy: false });
            validationSuccess = `Product name : ${product.name} was deleted.`;
            req.flash('validationSuccess', validationSuccess);
            return res.redirect('/manage/product');
        }
    } catch (error) {
        console.log(error);
    }
};

// ================ Rendering Forms =============== //
// Index
const getAllProducts = (req, res) => {
    Product.find().then((products) => {
        res.render('index', ({
            products: products
        }));
    }).catch((error => {
        console.log(error);
    }));
}

// View product
const getProductById = (req, res) => {
    const product_id = req.params.id;

    Product.findOne({_id: product_id}).then((product) => {
        if (product) {
            res.render('viewProductItem', ({
                product: product
            }));
        }
    }).catch((error) => {
        console.log(error);
    });
}

// Manage Products
const mgrProducts = (req, res) => {
    const searchQuery = req.query.search;
    let searchFilter = {};

    if (searchQuery) {
        const numericValue = parseFloat(searchQuery); // Try to convert searchQuery to a number

        if (!isNaN(numericValue)) {
            // If searchQuery can be converted to a number, use numerical filtering for price
            searchFilter = {
                $or: [
                    { name: new RegExp(searchQuery, "i") },
                    { description: new RegExp(searchQuery, "i") },
                    { price: numericValue } // Use the numeric value for filtering price
                ]
            };
        } else {
            // If searchQuery cannot be converted to a number, use textual search
            searchFilter = {
                $or: [
                    { name: new RegExp(searchQuery, "i") },
                    { description: new RegExp(searchQuery, "i") }
                ]
            };
        }
     };
    
    User.findById(loggedIn).then((user) => {
        Product.find(searchFilter).sort({ name: 1 }).then((product) => {
            res.render('manageProducts', ({
                product: product,
                user: user,
                success: req.flash('validationSuccess')
            }));
        }).catch((error) => {
            console.log(error);
        });
    }).catch(error => console.log(error));
}

// Form insert product
const form_addProduct = (req, res) => {
    res.render('form_addProduct');
}

// Form update product
const form_updateProduct = (req, res) => {
    const product_id = req.params.id;
    Product.findOne({_id: product_id}).then((product) => {
        if(product) {
            res.render('form_updateProduct',{product: product})
        }
    }).catch((error) => {
        console.log(error);
    })
}


module.exports = {
    getAllProducts,
    getProductById,
    mgrProducts,
    form_addProduct,
    form_updateProduct,
    deleteProdoctById,
    insertProduct,
    updateProduct

}