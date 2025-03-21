// import Router from "express"
// import {registerUser} from  "../controller/user.controller.js"

// const router = Router()

// router.route('/register').post(registerUser)

// export default router
import express from 'express';
import { registerUser,loginUser, logOut ,refreshToken} from '../controller/user.controller.js';
import {upload} from '../middlewares/multer.middleware.js';
import VerfyJwt from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register',
    upload.fields([                 // middleware before register user
    {name: 'avatar', maxCount: 1},   // check the avatar is uploaded
    {name: 'coverImage', maxCount: 1} // check the cover image is uploaded

])
,
registerUser
)

router.get('/register', (req, res) => {
    res.send('we are in register');
});

router.post('/login',loginUser
)

//we cal also writer
//router.route('/login).post(loginUser)


//secure route
router.post('/logout', 
  VerfyJwt,  // Middleware first
  logOut  ,
   // Then handler
);

router.post('/refreshtoken',
    refreshToken
)
export default router;