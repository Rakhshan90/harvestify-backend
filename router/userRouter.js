const express = require('express');
const {
    userRegisterCtrl,
    userLoginCtrl
} = require('../controller/userCtrl');

const userRouter = express.Router();


userRouter.post('/register', userRegisterCtrl);
userRouter.post('/login', userLoginCtrl);


module.exports = userRouter;