const express = require('express');
const dotenv = require('dotenv');
const dbConnect = require('./config/db/dbConnect');
const cors = require('cors');
const userRouter = require('./router/userRouter');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const productRouter = require('./router/productRouter');
const auctionRouter = require('./router/auctionRouter');
const scheduled = require('node-schedule');
const { closeAuctionCtrl } = require('./controller/auctionCtrl');





dotenv.config();
const app = express();

// db connection
dbConnect();


/*
This express middleware is responsible for parsing the incoming json data into req.body .It makes data available to req.body 
*/ 
app.use(express.json());

// cors
app.use(cors()); 

// user router
app.use('/api/users', userRouter);

// product router
app.use('/api/products', productRouter);

// auction router
app.use('/api/auctions', auctionRouter);

// for deployment purpose
app.get('/', (req, res)=>{
    res.status(200).send("Hello World!")
});

// scheduling the closeAuctionCtrl periodically
const closeAuctionsJob = scheduled.scheduleJob("*/1 * * * *", closeAuctionCtrl);

// middlewares
app.use(notFound);
app.use(errorHandler);

//server listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>{
    console.log(`server listening on ${PORT}`);
});