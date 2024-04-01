const expressAsyncHandler = require('express-async-handler');
const Auction = require('../model/Auction');
const Product = require('../model/Product');
const validateMongoId = require('../util/validateMongoId');
const User = require('../model/User');
const Bid = require('../model/Bid');
const nodemailer = require('nodemailer');
const Mailgen = require('mailgen');


const createAuctionCtrl = expressAsyncHandler(async (req, res) => {
  // Destructure required fields from the request body
  const { product, startingPrice, startTime, endTime, location, category } = req?.body;

  // Validate input fields
  if (!product || !startingPrice || !startTime || !endTime || !location || !category) {
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
      location,
      category,
    });

    // Send successful response with the created auction
    res.json(auction);
  } catch (error) {
    res.json(error);
  }
});

const fetchAllAuctionsCtrl = expressAsyncHandler(async (req, res) => {
  const location = req?.query?.location;
  const category = req?.query?.category;

  try {
    let auctions;
    if (location) {
      auctions = await Auction.find({
        location: {
          $in: [location],
        }
      }).populate('product').populate('winner')
    }
    else if (category) {
      auctions = await Auction.find({
        category: {
          $in: [category],
        }
      }).populate('product').populate('winner')
    }
    else {
      auctions = await Auction.find({}).populate('product').populate('winner');
    }
    res.json(auctions);
  } catch (error) {
    res.json(error);
  }
});

const fetchAuctionByIdCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req?.params;
  validateMongoId(id);
  try {
    const auction = await Auction.findById(id).populate('product').populate('winner');
    res.json(auction);
  } catch (error) {
    res.json(error);
  }
});

const placeBidCtrl = expressAsyncHandler(async (req, res) => {
  // Destructure required fields from the request body
  const { auctionId, bidAmount } = req?.body;

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

    // Check if auction is not started yet
    if (auction.startTime > Date.now()) {
      return res.status(400).json({ message: 'Auction is not started yet' });
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

const fetchBidsOnAuctionCtrl = expressAsyncHandler(async (req, res) => {
  const { auctionId } = req?.params;
  validateMongoId(auctionId);

  try {
    const bids = await Bid.find({ auction: auctionId }).populate('placedBy');
    res.json(bids);
  } catch (error) {
    res.json(error);
  }
});

const closeAuctionCtrl = expressAsyncHandler(async (req, res) => {
  try {
    // Use a scheduled task or cron job to call this function periodically
    // This example assumes it's called periodically
    // Find all auctions 
    const auctions = await Auction.find({});
    for (const auction of auctions) {
      // Check if the auction's end time has passed
      if (auction.endTime <= Date.now() && !auction.isNotified) {
        // Mark the auction as closed
        auction.isActive = false;

        // Find the highest bid
        let existingBids = await Bid.find({ auction: auction?._id }).populate("placedBy");
        // Sort bids by amount (highest first) after population
        existingBids.sort((a, b) => b.amount - a.amount);
        let highestBid = existingBids.length > 0 ? existingBids[0] : 0;
        // Update the winner (optional)
        if (highestBid) {
          auction.winner = highestBid.placedBy ? highestBid.placedBy._id : null; // Access user ID
        }


        // Save the updated auction
        await auction.save();

        // **Add notification logic here in the future**
        const winner = await User.findById(auction?.winner?._id);
        if(!winner) res.status(500).send("Address of Winner is not found")
        const product = await Product.findById(auction?.product?._id);
        const productOwner = await User.findById(product?.owner?._id);
        if(!productOwner) res.status(500).send("Address of Product owner is not found");

        const transporter = await nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD
          }
        });

        const mailGenerator = new Mailgen({
          theme: 'default',
          product: {
            name: 'Harvestify',
            link: 'https://mailgen.js/'
          }
        });

        // email for the winner
        const winnerEmailMsg = {
          body: {
            name: winner?.firstName,
            intro: `Congratulations! You have won the auction for "${product?.product_name}" with a bid of Rs ${highestBid?.amount}`,
            // Contact information of the product owner (name, email)
            dictionary: {
              name: `${productOwner?.firstName} ${productOwner?.lastName}`,
              email: productOwner?.email,
              phone: productOwner?.phone,
              location: productOwner?.location,
              gender: productOwner?.gender,
            },
          }
        };
        const winnerEmail = winner.email
        // Generate an HTML email with the provided contents
        const winnerHTMLEmail = mailGenerator.generate(winnerEmailMsg);

        const sentWinnerEmail = await transporter.sendMail({
          from: process.env.EMAIL,
          to: winnerEmail,
          subject: `You won the auction for ${product?.product_name}!`,
          html: winnerHTMLEmail,
        });

        // email for the product owner
        const ownerEmailMsg = {
          body: {
            name: productOwner?.firstName,
            intro: `Congratulations! Your product "${product?.product_name}" has been sold for Rs ${highestBid?.amount} to ${winner?.firstName} ${winner?.lastName} (${winner?.email})`,
            // Additional details like winner contact information (optional)
            dictionary: {
              name: `${winner?.firstName} ${winner?.lastName}`,
              email: winner?.email,
              phone: winner?.phone,
              location: winner?.location,
              gender: winner?.gender,
            },
          }
        };

        const ownerEmail = productOwner.email;
        // Generate an HTML email with the provided contents
        const ownerHTMLEmail = mailGenerator.generate(ownerEmailMsg);

        const sentOwnerEmail = await transporter.sendMail({
          from: process.env.EMAIL,
          to: ownerEmail,
          subject: "Your product has been sold in auction!",
          html: ownerHTMLEmail,
        });

        auction.isNotified = true;
        await auction.save();
      }
    }

    // Send a success message
    // res.json({ message: 'Auctions closed successfully' });
  } catch (error) {
    // Handle errors appropriately
    console.error("Error closing auctions:", error); // Log errors for debugging
  }
});

const cancelAuctionCtrl = expressAsyncHandler(async (req, res) => {
  const { auctionId } = req?.params;
  const { _id } = req?.user;
  validateMongoId(auctionId);
  try {
    const auction = await Auction.findById(auctionId);
    const user = await User.findById(_id).select("-password");
    if (!auction) return res.status(400).json({ message: "auction not found" });
    if (!auction.isActive) return res.status(400).json({ message: "auction has already ended" });
    if (!user.isAdmin) return res.status(400).json({ message: "only admin can cancel the auction" });
    auction.isActive = false;
    auction.save();
    res.json(auction);
  } catch (error) {
    res.json(error);
  }
});

const deleteAuctionCtrl = expressAsyncHandler(async (req, res) => {
  const { auctionId } = req?.params;
  const { _id } = req?.user;
  validateMongoId(auctionId);
  try {
    const user = await User.findById(_id).select("-password");
    if (!user.isAdmin) return res.status(400).json({ message: "only admin can delete the auction" });
    const deletedAuction = await Auction.findByIdAndDelete(auctionId);
    res.json(deletedAuction);
  } catch (error) {
    res.json(error);
  }
})



module.exports = {
  createAuctionCtrl,
  fetchAllAuctionsCtrl,
  fetchAuctionByIdCtrl,
  placeBidCtrl,
  fetchBidsOnAuctionCtrl,
  cancelAuctionCtrl,
  closeAuctionCtrl,
  deleteAuctionCtrl,
};