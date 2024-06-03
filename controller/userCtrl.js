const expressAsyncHandler = require('express-async-handler');
const User = require('../model/User');
const { generateToken } = require('../config/token/generateToken');
const validateMongoId = require('../util/validateMongoId');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Mailgen = require('mailgen');
const cloudinaryUploadImg = require('../util/cloudinary');
const fs = require('fs')

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
            location: req?.body?.location,
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

const updatePasswordCtrl = expressAsyncHandler(async (req, res) => {
    const { _id } = req?.user;
    // check whether user id is valid
    validateMongoId(_id);
    const { password } = req?.body;
    const user = await User.findById(_id);
    if (password) {
        user.password = password;
        const updateUser = await user.save();
        res.json(updateUser);
    }
    else {
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

const generateResetPasswordTokenCtrl = expressAsyncHandler(async (req, res) => {
    const email = req?.body?.email;
    const user = await User.findOne({ email });
    if (!user) throw new Error("No such user is found");
    try {
        const token = await user.createResetPasswordToken();
        await user.save();

        const resetUrl = `If your were requested to reset your account, please reset your account within 10 mins, otherwise ignore this meassage <a href="https://harvestify-frontend.vercel.app/reset-password/${token}">Click to verify your account<a/>`;

        //building email message
        const transporter = await nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            }
        });


        // Configure mailgen by setting a theme and your product info
        var mailGenerator = new Mailgen({
            theme: 'default',
            product: {
                // Appears in header & footer of e-mails
                name: 'Harvestify',
                link: 'https://mailgen.js/'
                // Optional product logo
                // logo: 'https://mailgen.js/img/logo.png'
            }
        });

        var emailMsg = {
            body: {
                name: user?.firstName,
                intro: 'Welcome to Harvestify! Reset your password.',
                action: {
                    instructions: 'To Reset your password, please click here:',
                    button: {
                        color: '#22BC66', // Optional action button color
                        text: 'Reset Password',
                        link: `https://harvestify-frontend.vercel.app/reset-password/${token}`
                    }
                },
                outro: 'Do not reply to this email, It is an auto-generated email'
            }
        };

        // Generate an HTML email with the provided contents
        var emailBody = mailGenerator.generate(emailMsg);




        const sentEmail = await transporter.sendMail({
            from: process.env.EMAIL, // sender address
            to: user?.email, // list of receivers
            subject: "Reset Your Password", // Subject line
            // text: "Hello world?", // plain text body
            html: emailBody, // html body
        });
        res.json(resetUrl);
    } catch (error) {
        res.json(error);
    }
});

const resetPasswordTokenCtrl = expressAsyncHandler(async (req, res) => {
    const { password, token } = req?.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordTokenExpiration: { $gt: Date.now() }
    });
    if (!user) throw new Error("Failed to reset your password, try again");
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiration = undefined;
    await user.save();
    res.json(user);
});

const profilePhotoUploadCtrl = expressAsyncHandler(async (req, res) => {
    //Find the login user
    const { _id } = req?.user;
    // get path to image
    const imagePath = `public/images/profiles/${req?.file?.filename}`
    const uploadedImg = await cloudinaryUploadImg(imagePath);
    //update user profile photo
    const updatedUser = await User.findByIdAndUpdate(_id,
        {
            profilePhoto: uploadedImg?.url
        },
        { new: true });
    // remove image that is stored in images/profiles/image
    fs.unlinkSync(imagePath);
    res.json(updatedUser);
})


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
    generateResetPasswordTokenCtrl,
    resetPasswordTokenCtrl,
    profilePhotoUploadCtrl,
};