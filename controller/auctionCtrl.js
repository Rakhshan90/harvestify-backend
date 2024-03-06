const expressAsyncHandler = require('express-async-handler');
const Auction = require('../model/Auction');
const Product = require('../model/Product');
const validateMongoId = require('../util/validateMongoId');
const User = require('../model/User');
const Bid = require('../model/Bid');


const createAuctionCtrl = expressAsyncHandler(async (req, res) => {
  // Destructure required fields from the request body
  const { product, startingPrice, startTime, endTime } = req?.body;

  // Validate input fields
  if (!product || !startingPrice || !startTime || !endTime) {
    throw new Error('Please provide all required fields: product, startingPrice, startTime, endTime');
  }

  // Validate product ID using validateMongoId function
  validateMongoId(product);

  // Check if the product exists using its ID
  const existingProduct = await Product.findById(product);
  if (!existingProduct) {
    throw new Error('Product not found');
  }

  try {
    // Create a new auction document
    const auction = await Auction.create({
      product,
      startingPrice,
      startTime,
      endTime,
    });

    // Send successful response with the created auction
    res.json(auction);
  } catch (error) {
    res.json(error);
  }
});

const fetchAllAuctionsCtrl = expressAsyncHandler(async (req, res) => {
  try {
    const auctions = await Auction.find({});
    res.json(auctions);
  } catch (error) {
    res.json(error);
  }
});

const fetchAuctionByIdCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req?.params;
  validateMongoId(id);
  try {
    const auction = await Auction.findById(id);
    res.json(auction);
  } catch (error) {
    res.json(error);
  }
});

const placeBidCtrl = expressAsyncHandler(async (req, res) => {
  // Destructure required fields from the request body
  const { auctionId, bidAmount } = req?.body;

  console.log({ auctionId, bidAmount });
  // Validate input fields
  if (!auctionId || !bidAmount) {
    throw new Error('Please provide both auction ID and bid amount');
  }

  // Validate auction ID using validateMongoId function
  validateMongoId(auctionId);

  try {
    // Fetch the auction document based on ID
    const auction = await Auction.findById(auctionId);
    // Ensure the auction exists
    if (!auction) {
      return res.status(400).json({ message: 'Auction not found' });
    }

    // Check if the auction is active (not ended)
    if (!auction.isActive) {
      return res.status(400).json({ message: 'Auction has already ended' });
    }

    // Validate the user making the bid (optional)
    // You can replace this check with your authentication logic
    // to ensure only registered users can place bids
    if (!req?.user) {
      return res.status(400).json({ message: 'You must be logged in to place a bid' });
    }

    // Fetch the user details (optional)
    const user = await User.findById(req?.user._id);


    // Check if the user is the product owner (optional)
    // You can prevent users from bidding on their own products
    //   if (user && user._id.equals(auction.product.owner)) {
    //     throw new Error('You cannot bid on your own product');
    //   }

    // Validate the bid amount against the starting price and existing bids
    if (bidAmount <= auction.startingPrice) {
      return res.status(400).json({ message: 'Bid amount must be greater than the starting price' });
    }

    const existingBids = await Bid.find({ auction: auctionId });
    const highestBid = existingBids.length > 0 ? existingBids.reduce((max, bid) => Math.max(max, bid.amount), 0) : 0;

    if (bidAmount <= highestBid) {
      // throw new Error('Bid amount must be greater than the current highest bid');
      return res.status(400).json({ message: 'Bid amount must be greater than the current highest bid' });
    }

    // Create a new bid document
    const newBid = await Bid.create({
      auction: auctionId,
      placedBy: user ? user._id : null, // Set user ID if available
      amount: bidAmount,
    });

    // Update the auction's currentBid field (optional)
    // You can implement middleware or a separate function to handle this
    auction.currentBid = bidAmount;
    await auction.save();

    // Send successful response with the created bid
    res.json(newBid);
  } catch (error) {
    // Handle errors appropriately
    res.json(error);
  }
});


module.exports = {
  createAuctionCtrl,
  fetchAllAuctionsCtrl,
  fetchAuctionByIdCtrl,
  placeBidCtrl,
};