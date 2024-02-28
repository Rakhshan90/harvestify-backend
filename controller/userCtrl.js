const expressAsyncHandler = require('express-async-handler');
const User = require('../model/User');
const { generateToken } = require('../config/token/generateToken');

const userRegisterCtrl = expressAsyncHandler(async (req, res) => {
    const userExist = await User.findOne({ email: req?.body?.email });
    if (userExist) {
        throw new Error("User already exists");
    }

    try {
        const user = await User.create({
            firstName: req?.body?.firstName,
            lastName: req?.body?.lastName,
            email: req?.body?.email,
            password: req?.body?.password,
            phone: req?.body?.phone,
            gender: req?.body?.gender,
            user_type: req?.body?.user_type,
        })

        res.json(user);
    } catch (error) {
        res.json(error);
    }
});

const userLoginCtrl = expressAsyncHandler(async (req, res) => {
    //destructure user's email and password 
    const {email, password} = req?.body;
    
    // check whether user is exist 
    const foundUser = await User.findOne({email});

    // check if user's password is exist
    if(foundUser && (await foundUser.isPasswordMatch(password))){
        res.json({
            _id: foundUser?._id,
            firstName: foundUser?.firstName,
            lastName: foundUser?.lastName,
            email: foundUser?.email,
            profilePhoto: foundUser?.profilePhoto,
            isAdmin: foundUser?.isAdmin,
            token: generateToken(foundUser?._id),
            phone: foundUser?.phone,
            location: foundUser?.location,
            gender: foundUser?.gender,
            user_type: foundUser?.user_type,
        })
    }
    else{
        res.status(401)
        throw new Error("Invalid login credentials")
    }
});





module.exports = {
    userRegisterCtrl, 
    userLoginCtrl,
};