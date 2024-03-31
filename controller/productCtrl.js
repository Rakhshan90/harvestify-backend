const expressAsyncHandler = require('express-async-handler');
const Product = require('../model/Product');
const validateMongoId = require('../util/validateMongoId');

const createProductCtrl = expressAsyncHandler(async (req, res) => {
    const { _id } = req?.user;
    validateMongoId(_id);
    
    // get path to image
    const imagePath = `images/products/${req.file.filename}`
    console.log(imagePath);
    try {
        // const product = await Product.create({
        //     ...req?.body,
        //     owner: _id,
        // })
        // res.json(product);
        res.send('success');
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

    try {
        const updatedProduct = await Product.findByIdAndUpdate(id, {
            ...req?.body
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