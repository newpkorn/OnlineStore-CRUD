const express = require('express');
const router = express.Router();

// Middleware.
const authMiddleware = require('../middleware/authMiddleware');

//  Controllers.
const productController = require('../controllers/productController');
const userController = require('../controllers/userController')

// Routes.
router.get('/', productController.getAllProducts);
router.get('/product/:id', productController.getProductById);
router.get('/manage/product', authMiddleware.authMiddleware, productController.mgrProducts);
router.get('/addProduct', authMiddleware.authMiddleware, productController.form_addProduct);
router.get('/delete/:id', productController.deleteProdoctById);
router.get('/updateProduct/:id', productController.form_updateProduct);
router.post('/insert', productController.upload.single('image'), productController.insertProduct);
router.post('/updateProduct', productController.upload.single('image'), productController.updateProduct);

router.get('/login', authMiddleware.redirectIfAuth, userController.form_login);
router.get('/register', authMiddleware.authByAdmin, userController.form_register);
router.get('/logout', userController.logout);
router.get('/user/update', userController.form_updateUser);
router.get('/manage/user', authMiddleware.authByAdmin, userController.form_manageUsers);
router.get('/admin/manage/user/:id',authMiddleware.authByAdmin, userController.form_admin_UpdateUser);
router.get('/user/delete/:id', userController.deleteUser);


router.post('/user/register', userController.storeUser);
router.post('/user/login', userController.user_login);
router.post('/user/update', userController.updateUser);

router.post('/admin/user/update', userController.admin_userUpdate);


module.exports = router;
