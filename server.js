const express = require('express');
const dotenv = require('dotenv');
const dbConnect = require('./config/db/dbConnect');
const userRouter = require('./router/userRouter');
const { errorHandler, notFound } = require('./middleware/errorHandler');





dotenv.config();
const app = express();

// db connection
dbConnect();


/*
This express middleware is responsible for parsing the incoming json data into req.body .It makes data available to req.body 
*/ 
app.use(express.json());

// user router
app.use('/api/users', userRouter);



// middlewares
app.use(notFound);
app.use(errorHandler);

//server listening
const PORT = 5000 || process.env.PORT;
app.listen(PORT, ()=>{
    console.log(`server listening on ${PORT}`);
});