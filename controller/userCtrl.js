const expressAsyncHandler = require('express-async-handler');
const User = require('../model/User');
const { generateToken } = require('../config/token/generateToken');
const validateMongoId = require('../util/validateMongoId');

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
    const { email, password } = req?.body;

    // check whether user is exist 
    const foundUser = await User.findOne({ email });

    // check if user's password is exist
    if (foundUser && (await foundUser.isPasswordMatch(password))) {
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
    else {
        res.status(401)
        throw new Error("Invalid login credentials")
    }
});

const fetchUsersCtrl = expressAsyncHandler(async (req, res) => {
    try {
        const users = await User.find({}).select("-password");
        res.json(users);
    } catch (error) {
        res.json(error);
    }
});

const deleteUserCtrl = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    // check whether user id is valid
    validateMongoId(id);
    try {
        const deletedUser = await User.findByIdAndDelete(id);
        res.json(deletedUser);
    } catch (error) {
        res.json(error);
    }
});

const fetchUserDetailsCtrl = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    // check whether user id is valid
    validateMongoId(id);
    try {
        const user = await User.findById(id).select("-password");
        res.json(user);
    } catch (err) {
        res.json(err);
    }
});

const updateUserCtrl = expressAsyncHandler(async (req, res) => {
    const { _id } = req?.user;
    // check whether user id is valid
    validateMongoId(_id);
    try {
        const updatedUser = await User.findByIdAndUpdate(_id, {
            firstName: req?.body?.firstName,
            lastName: req?.body?.lastName,
            email: req?.body?.email,
            phone: req?.body?.phone,
            location: req?.body?.location,
            gender: req?.body?.gender,
        }, { new: true, runValidators: true });

        res.json(updatedUser);
    } catch (error) {
        res.json(error);
    }
});

const updatePasswordCtrl = expressAsyncHandler(async (req, res)=>{
    const {_id} = req?.user;
    // check whether user id is valid
    validateMongoId(_id);
    const {password} = req?.body;
    const user = await User.findById(_id);
    if(password){
        user.password = password;
        const updateUser = await user.save();
        res.json(updateUser);
    }
    else{
        res.json(user);
    }
});

const blockUserCtrl = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoId(id);
    const user = await User.findByIdAndUpdate(
        id,
        {
            isBlocked: true,
        },
        { new: true });
    res.json(user);
})

const unBlockUserCtrl = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoId(id);
    const user = await User.findByIdAndUpdate(
        id,
        {
            isBlocked: false,
        },
        { new: true });
    res.json(user);
});





module.exports = {
    userRegisterCtrl,
    userLoginCtrl,
    fetchUsersCtrl,
    deleteUserCtrl,
    fetchUserDetailsCtrl,
    updateUserCtrl,
    updatePasswordCtrl,
    blockUserCtrl,
    unBlockUserCtrl,
};