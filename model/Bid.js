const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: [true, "Bid amount is required"],
    },
    placedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "bidder is required"],
    },
    auction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auction',
        required: [true, "auction is required"],
    },

}, {
    toJSON: {
        virtuals: true,
    },
    toObject: {
        virtuals: true,
    },
    timestamps: true,
});

// compile bidSchema into model
const Bid = mongoose.model('Bid', bidSchema);
module.exports = Bid;