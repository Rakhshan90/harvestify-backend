const express = require('express');
const { createAuctionCtrl, fetchAllAuctionsCtrl, fetchAuctionByIdCtrl, placeBidCtrl } = require('../controller/auctionCtrl');
const authMiddleware = require('../middleware/authMiddleware');
const auctionRouter = express.Router();


auctionRouter.post('/create', authMiddleware, createAuctionCtrl);
auctionRouter.get('/', fetchAllAuctionsCtrl);
auctionRouter.get('/:id', fetchAuctionByIdCtrl);
auctionRouter.post('/place/bid', authMiddleware, placeBidCtrl);

module.exports = auctionRouter;