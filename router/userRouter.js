const express = require('express');
const {
    userRegisterCtrl,
    userLoginCtrl,
    fetchUsersCtrl,
    deleteUserCtrl,
    fetchUserDetailsCtrl,
    updateUserCtrl,
    updatePasswordCtrl,
    blockUserCtrl,
    unBlockUserCtrl,
} = require('../controller/userCtrl');
const authMiddleware = require('../middleware/authMiddleware');

const userRouter = express.Router();


userRouter.post('/register', userRegisterCtrl);
userRouter.post('/login', userLoginCtrl);
userRouter.get('/', fetchUsersCtrl);
userRouter.delete('/delete/:id', authMiddleware, deleteUserCtrl);
userRouter.get('/:id', fetchUserDetailsCtrl);
userRouter.put('/update', authMiddleware, updateUserCtrl);
userRouter.put('/update/password', authMiddleware, updatePasswordCtrl);
userRouter.put('/block-user/:id', authMiddleware, blockUserCtrl);
userRouter.put('/unblock-user/:id', authMiddleware, unBlockUserCtrl);

module.exports = userRouter;