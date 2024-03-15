const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
    // Reference to the product being auctioned
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    // Starting price for the auction
    startingPrice: {
        type: Number,
        required: true,
    },
    // Date and time when the auction starts
    startTime: {
        type: Date,
        required: true,
    },
    // Date and time when the auction ends
    endTime: {
        type: Date,
        required: true,
    },
    // Array of references to bids placed on the auction
    bids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bid',
    }],
    // Field to store the current highest bid amount
    currentBid: {
        type: Number,
        default: 0,
    },
    // Reference to the user who won the auction (initially set to null)
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    // Flag indicating whether the auction is currently ongoing
    isActive: {
        type: Boolean,
        default: true,
    },
    location: {
        type: String,
        required: [true, "location is required"],
    },
    category: {
        type: String,
        required: [true, "category is required"],
    },
    isNotified: {
        type: Boolean,
        default: false,
    }
},
    {
        toJSON: {
            virtuals: true,
        },
        toObject: {
            virtuals: true,
        },
        timestamps: true,
    });

// Compile auctionSchema into model
const Auction = mongoose.model('Auction', auctionSchema);
module.exports = Auction;
