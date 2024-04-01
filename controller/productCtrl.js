const expressAsyncHandler = require('express-async-handler');
const Product = require('../model/Product');
const validateMongoId = require('../util/validateMongoId');
const cloudinaryUploadImg = require('../util/cloudinary');
const fs = require('fs')

const createProductCtrl = expressAsyncHandler(async (req, res) => {
    const { _id } = req?.user;
    validateMongoId(_id);
    
    // get path to image
    const imagePath = `public/images/products/${req?.file?.filename}`
    const uploadedImg = await cloudinaryUploadImg(imagePath);
    try {
        const product = await Product.create({
            ...req?.body,
            image: uploadedImg?.url ,
            owner: _id,
        })
        // remove image that is stored in images/products/image
        fs.unlinkSync(imagePath);
        res.json(product);
    } catch (error) {
        res.json(error);
    }
});

const fetchProductsCtrl = expressAsyncHandler(async (req, res) => {
    try {
        const products = await Product.find({}).populate('owner');
        res.json(products);
    } catch (error) {
        res.json(error);
    }
});

const fetchProductDetails = expressAsyncHandler(async (req, res)=>{
    const {id} = req?.params;
    validateMongoId(id);

    try {
        const product = await Product.findById(id).populate('owner');
        res.json(product);
    } catch (error) {
        res.json(error);
    }
});

const updateProductCtrl = expressAsyncHandler(async (req, res)=>{
    const {id} = req?.params;
    validateMongoId(id);

    // get path to image
    const imagePath = `public/images/products/${req?.file?.filename}`
    const uploadedImg = await cloudinaryUploadImg(imagePath);
    try {
        const updatedProduct = await Product.findByIdAndUpdate(id, {
            ...req?.body,
            image: uploadedImg?.url ,

        }, {new: true, runValidators: true});

        res.json(updatedProduct);
    } catch (error) {
        res.json(error);
    }
});

const deleteProductCtrl = expressAsyncHandler(async (req, res)=>{
    const {id} = req?.params;
    validateMongoId(id);

    try {
        const deletedProduct = await Product.findByIdAndDelete(id);
        res.json(deletedProduct);
    } catch (error) {
        res.json(error);
    }
})

module.exports = {
    createProductCtrl,
    fetchProductsCtrl,
    fetchProductDetails,
    updateProductCtrl,
    deleteProductCtrl,
};