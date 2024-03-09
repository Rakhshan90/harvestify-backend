const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, "First name is required"],
    },
    lastName: {
        type: String,
        required: [true, "Last name is required"],
    },
    profilePhoto: {
        type: String,
        default: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
    },
    email: {
        type: String,
        required: [true, "email is required"],
    },
    password: {
        type: String,
        required: [true, "password is required"],
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    user_type: {
        type: String,
        enum: ['Admin', 'Farmer', 'Buyer'],
    },
    phone: {
        type: Number,
        required: [true, "phone is required"],
    },
    location: {
        type: String,
    },
    gender: {
        type: String,
        required: [true, "gender is required"],
    },
},
    {
        toJSON: {
            virtuals: true,
        },
        toObject: {
            virtuals: true,
        },
        timestamps: true,
    }
);

userSchema.virtual('products', {
    ref: 'Product',
    foreignField: 'owner',
    localField: '_id',
});


//Hash password
userSchema.pre('save', async function (next) {
    if (!this.isModified("password")) {
        next();
    }
    //hash password
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next();
});

//Match password
userSchema.methods.isPasswordMatch = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};



// compile userSchems into model
const User = mongoose.model('User', userSchema);
module.exports = User;
