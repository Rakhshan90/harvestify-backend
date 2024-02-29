const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
    createProductCtrl,
    fetchProductsCtrl,
    fetchProductDetails,
    updateProductCtrl,
    deleteProductCtrl
} = require('../controller/productCtrl');


const productRouter = express.Router();

productRouter.post('/create', authMiddleware, createProductCtrl);
productRouter.get('/', fetchProductsCtrl);
productRouter.get('/:id', fetchProductDetails);
productRouter.put('/:id', authMiddleware, updateProductCtrl);
productRouter.delete('/:id', authMiddleware, deleteProductCtrl);


module.exports = productRouter;

