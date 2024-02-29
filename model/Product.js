const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    product_name: {
        type: String,
        required: [true, "Product Name is required"],
    },
    price: {
        type: Number,
        required: [true, "Product Price is required"],
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "Owner is required"],
    },
    description: {
        type: String,
    },
    image: {
        type: String,
        default: "https://i.ibb.co/Y787gfk/Agri-Mechanization-TPCI.jpg",
    },
    isActive: {
        type: Boolean,
        required: [true, "Your Product Status is required"],
    },
    quantity: {
        type: String,
        required: [true, "Product quantity is required"],
    }
}, 
{
    toJSON:{
        virtuals: true,
    },
    toObject:{
        virtuals: true,
    },
    timestamps: true,
});

//Compile mongoose schema into model
const Product = mongoose.model('Product', productSchema);
module.exports = Product; 