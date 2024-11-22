const Product = require("../models/Products");
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary with your credentials
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create disk storage for uploading images.
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'online_store_products',
        format: async (req, file) => 'jpg',
        public_id: async (req, file) => Date.now().toString(),
        overwrite: true
    }
});

const upload = multer({ storage: storage });

const uploadToCloudinary = async (file, folder = 'online_store_products') => {
    try {
        const uploadResult = await cloudinary.uploader.upload(file, {
            folder: folder,
            public_id: Date.now().toString(),
            overwrite: true,
            transformation: [
                { width: 500, height: 500, crop: 'limit' },
                { quality: 'auto' },
                { fetch_format: 'auto' }
            ]
        });

        return uploadResult;
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        throw error;
    }
};

const deleteOriginalFileName = async (folder, original_filename) => {
    try {
        const deleteResult = await cloudinary.api.delete_resources(`${folder}/${original_filename}`, {
            type: 'upload',
            resource_type: 'image',
        });
        return deleteResult;
    } catch (error) {
        console.error('Error deleting original filename from Cloudinary:', error);
        throw error;
    }
};

const deleteFromCloudinary = async (publicId, folder) => {
    try {
        const deleteResult = await cloudinary.api.delete_resources(`${folder}/${publicId}`, {
            type: 'upload',
            resource_type: 'image',
        });
        return deleteResult;
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        throw error;
    }
};

let validationSuccess = '';

// Insert Product
const insertProduct = async (req, res) => {
    try {
        let imageUrl;

        // Upload an image
        if (req.file) {
            const uploadResult = await uploadToCloudinary(req.file.path);
            imageUrl = uploadResult.secure_url;
            console.log('uploadResult: ', uploadResult);

            if (uploadResult.original_filename) {
                await deleteOriginalFileName('online_store_products', uploadResult.original_filename).then(console.log)
            }
        }

        const doc = new Product({
            name: req.body.name,
            price: req.body.price,
            description: req.body.details,
            imagePath: imageUrl || null,
            added_by: loggedUser + " at " + new Date()
        });

        await doc.save();
        req.flash('validationSuccess', `Product name ${req.body.name} was added successfully`);
        return res.redirect('/manage/product');
    } catch (error) {
        console.log(error);
        return res.status(500).send('Error inserting product');
    }
};

// Update Product
const updateProduct = async (req, res) => {
    const { product_id, name, price, details } = req.body;

    if (!mongoose.Types.ObjectId.isValid(product_id)) {
        console.log('Invalid product ID');
        req.flash('error', 'Invalid product ID');
        return res.redirect('/manage/product');
    }

    try {
        const updateFields = {
            name,
            price,
            description: details,
            updated_by: `${loggedUser} at ${new Date()}`,
            updated_at: new Date(),
        };

        if (req.file) {
            // Fetch current product imagePath
            const product = await Product.findById(product_id, 'imagePath');
            if (!product) {
                req.flash('error', 'Product not found');
                return res.redirect('/manage/product');
            }

            // Delete old image if it exists
            if (product.imagePath) {
                const publicId = product.imagePath.split('/').pop().split('.')[0];
                if (publicId) {
                    await deleteFromCloudinary(publicId, 'online_store_products');
                    console.log('Old Image Deleted:', publicId);
                }
            }

            // Upload new image
            const uploadResult = await uploadToCloudinary(req.file.path);
            updateFields.imagePath = uploadResult.secure_url;
            console.log('New Image Uploaded:', uploadResult.secure_url);

            if (uploadResult.original_filename) {
                await deleteOriginalFileName('online_store_products', uploadResult.original_filename).then(console.log);
            }
        }

        // Update product in the database
        const updatedProduct = await Product.findByIdAndUpdate(product_id, updateFields, { new: true });
        if (!updatedProduct) {
            req.flash('error', 'Product not found');
            return res.redirect('/manage/product');
        }

        req.flash('validationSuccess', `Product ${updatedProduct.name} updated successfully`);
        res.redirect('/manage/product');
    } catch (error) {
        console.error('Update product error:', error);
        req.flash('error', 'Error updating product');
        res.redirect('/manage/product');
    }
};

// Delete Product
const deleteProdoctById = async (req, res) => {
    const product_id = req.params.id;
    console.log('product_id', product_id);

    try {
        const product = await Product.findById(product_id);
        console.log('found product: ', product);

        if (product) {
            const imagePath = product.imagePath;
            console.log('imagePath: ', imagePath);

            if (imagePath) {
                const publicId = imagePath.split('/').pop().split('.')[0]; // Extract public ID
                console.log('publicId:', publicId);
                await deleteFromCloudinary(publicId, 'online_store_products')
                    .then(console.log)
                    .catch(console.error);
            }
            await Product.findByIdAndDelete(product_id);

            req.flash('validationSuccess', `Product name: ${product.name} was deleted.`);
            return res.redirect('/manage/product');
        } else {
            return res.status(404).send('Product not found');
        }
    } catch (error) {
        console.log(error);
        return res.status(500).send('Error deleting product');
    }
};

// ================ Rendering Forms =============== //
// Index
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().exec();
        res.render('index', { products });
    } catch (error) {
        console.log(error);
    }
};

// View product
const getProductById = async (req, res) => {
    const product_id = req.params.id;
    try {
        const product = await Product.findById(product_id).exec();
        if (product) {
            res.render('viewProductItem', { product });
        } else {
            return res.status(404).send('Product not found');
        }
    } catch (error) {
        console.log(error);
    }
};

// Manage Products
const mgrProducts = async (req, res) => {
    const searchQuery = req.query.search;
    let searchFilter = {};

    if (searchQuery) {
        const numericValue = parseFloat(searchQuery); // Check if searchQuery is a number
        searchFilter = numericValue ? {
            $or: [
                { name: new RegExp(searchQuery, "i") },
                { description: new RegExp(searchQuery, "i") },
                { price: numericValue }
            ]
        } : {
            $or: [
                { name: new RegExp(searchQuery, "i") },
                { description: new RegExp(searchQuery, "i") }
            ]
        };
    }

    try {
        const products = await Product.find(searchFilter).sort({ name: 1 }).exec();

        res.render('manageProducts', {
            products,
            loggedUser,
            userRole,
            success: req.flash('validationSuccess')
        });
    } catch (error) {
        console.log(error);
    }
};

// Form insert product
const form_addProduct = (req, res) => {
    res.render('form_addProduct');
};

// Form update product
const form_updateProduct = async (req, res) => {
    const product_id = req.params.id;
    try {
        const product = await Product.findById(product_id).exec();
        if (product) {
            res.render('form_updateProduct', { product });
        } else {
            return res.status(404).send('Product not found');
        }
    } catch (error) {
        console.log(error);
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    mgrProducts,
    form_addProduct,
    form_updateProduct,
    deleteProdoctById,
    insertProduct,
    updateProduct,
    upload,
};
