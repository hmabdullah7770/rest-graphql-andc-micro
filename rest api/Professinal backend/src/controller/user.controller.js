import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadResult } from "../utils/Claudnary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken'

const generateAccessTokenAndRefreshToken = async (userId) => {
  const user = await User.findById(userId);
  const accessToken = user.getAccessToken();
  const refreshToken = user.getRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

export const registerUser = asyncHandler(async (req, res) => {
  // res.status(200).json({
  //     message: "user registered succesfully"
  // })

  //request from frontent send accept data in request.body
  // validation of data  we get all the data required
  // check if the user already exit findone()
  // upload the avatar (req) and backgorund image
  // upload to cloudnay
  // save the user in database
  // cheack the user is created
  // remove the password and refresh token from responce
  // return response

  const { username, email, password, fullName } = req.body;
  console.log("email is :", email);

  //-----for biggners this is good methord but we write professional so we follow another
  //if (!username || !email || !password || !fullName) {
  //res.status(400).json({
  //message: "All fields are required"})
  //throw new Error("All fields are required") }
  //res.status(200).json({
  //message: "user registered successfully"});
  //console.log("username is:",username.trim(), "email", email.trim());

  if (
    [username, email, password, fullName].some((fields) => fields?.trim() == "")
  ) {
    throw new ApiError(400, "All fields are required some of them are empty");
  }

  const CheckUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  console.log("USer is :", CheckUser);

  if (CheckUser) {
    throw new ApiError(409, "User already exist");
  }

  const avatarLocalpath = req.files.avatar[0].path; //local file path for multer
  const coverImageLocalpath = req.files.coverImage[0].path;

  // let coverImageLocalpath;
  // if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
  // const coverImageLocalpath = req.files.coverImage[0].path ;   //local file path for multer
  // }
  // console.log(" coverImageLocalpath",coverImageLocalpath)
  if (!avatarLocalpath) {
    throw new ApiError(400, "Avatar is required");
  }
  const avatar = await uploadResult(avatarLocalpath);

  const coverImage = await uploadResult(coverImageLocalpath);

  if (!avatar) {
    throw new ApiError(500, "Avatar is not on cloudnary");
  }

  const createuser = await User.create({
    username,
    email,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    password,
    fullName,
  });

  const createdUser = await User.findById(createuser._id).select(
    " -password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "someting went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

export const loginUser = asyncHandler(async (req, res) => {
  // req.body = data from frontend
  //username or email  shoudl be unique
  // find user from db
  // check if user exist
  // check if password is correct if not reset password using gmail
  // generate access token and refresh token send both to the user
  // send cookies to the user

  const { email, username, password } = req.body;

  const user = await User.findOne({ $or: [{ email }, { username }] });

  if (!user) {
    throw new error(404, "User not found");
  }

  const checkpassword = user.isPasswordCorrect(password);

  if (!checkpassword) {
    throw new ApiError(401, "Password is incorrect");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const loggedInUser = User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!loggedInUser) {
    throw new ApiError(500, "something went wrong while login");
  }

  const options = {
    httpOnly: true,
    security: true,
  };

  //  res.cookie("accessToken", accessToken, options)
  //  res.cookie("refreshToken" , refreshToken , options)

  //   return res.status(201).json(

  //     new ApiResponse(200, loggedInUser, "User logged in successfullu")
  //   )

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)

    .json(
      new ApiResponse(
        201,
        { user: loggedInUser, accessToken, refreshToken },
        { messege: "User logged in successfully" }
      )
    );
});

export const logOut = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.userVerfied._id,
    {
      $set: {
        refreshToken: undefined, //remove the accessToken
      },
    },
    {
      new: true, //return the updated user without refresh token
    }
  );


  const options = {
    httpOnly: true,
    security: true,
  };
  // req.userVerfied._id;

  res.clearCookie("accessToken",options).
  res.clearCookie("refreshToken",options)
  .status(200).
  json(new ApiResponse(
    200,
    "User logged out successfully"
  ))



  //remove refreshtoken from Db
  //redirect to the register screen
});


export const refreshToken = asyncHandler(async (req, res)=>{

  //get the refresh token from the cookies
  //verify the refresh token
  //find the user from the database 
  //generate new access token and refresh token
  //send the new access token and refresh token to the user
  //send the cookies to the user
  //return the response

  const incommingrefreshToken = req.cookies?.refreshToken || req.headers("Authorization")?.replace('Bearer ','')

  if(!incommingrefreshToken ){

    throw new ApiError(401,"Refresh token is not in the header or cookies")

  }

  const decordreftoken = jwt.verify(incommingrefreshToken,process.env.REFRESH_TOKEN_SECRET)

  if(!decordreftoken){

    throw new ApiError(401,"Refresh token is invalid or expired")

  }

  const user = User.findById(decordreftoken._id)

  if(!user){
    throw new ApiError(404,"decorded user not found in the database")

  }

  const {accessToken,refreshToken}= await(generateAccessTokenAndRefreshToken(user._id))

  const options = {
    httpOnly: true,
    security: true,
  }

  return res.status(200).cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(new ApiResponse(200,{accessToken,refreshToken},"Token refreshed successfully"))
})

export const changePassword = asyncHandler(async(req,res)=>{

  //get the password from frontend
  //validate the pasword
  //verify the password is correct
  //find the user from the database
  //cahnge password save in db
  //return response

  const {oldpassword,newpassword} = req.body

  if(!oldpassword || !newpassword){

    throw new ApiError(400,"Old password and new password is required")
  }
   
  

  const user = User.findById(req.userVerfied._id)

  const validpassword=user.isPasswordCorrect(oldpassword)
  
  if(!validpassword){
       throw new ApiError(401,"Old password is incorrect")
  }

  user.password = newpassword
  await user.save({validateBeforeSave:false})

  return res.status(200).json(new ApiResponse(200,"Password changed successfully"))
})


export const getuser = asyncHandler(async(req,res)=>{

  //get the user from the database
  
  const user = User.findById(req.userVerfied._id).select("-password -refreshtoken")

  if(!user){
    throw new ApiError(404,"User not found")

  }

  return res.status(200).json(new ApiResponse(200,user,"User found successfully"))
})

//update user

export const updateuser = asyncHandler(async(req,res)=>{

  //get the user from the database
  //update the user in the database 
  //return response 
  const {email,fullName}= req.body

  if(!email || !fullName){
    throw new ApiError(400,"Email and fullname is required")

  }

  const user = await User.findByIdAndUpdate(req.userVerfied._id,
    {
      $set:{
        email,
        fullName: fullName
      }
      ,new:true
    }
  )

  if(!user){

    throw new ApiError(404,"Verified user not found")
  }

  return res.status(200).json(new ApiResponse(200,user,"User updated successfully"))
})

//change avatar image
export const changeavatar = asyncHandler(async(req,res)=>{

  //get the avatar from image frontend
  //upload the image to cloudnary 
  //update the user in the database
  

  

 
  
   const avatarLocalpath = req.file.avatar[0].path; //local file path for multer
   const avatar = await uploadResult(avatarLocalpath);
   if (!avatar) {
    
    throw new ApiError(400,"Avatar is required")
  }

  if(!avatar.url){
    throw new ApiError('404', "Avatar url not found")
  }

  const user = User.findByIdAndUpdate(req.userVerfied._id,{

    $set:{
      avatar:avatar.url
    }

  },{new:true})
  if(!user){
    throw new ApiError(404,"verified user not found")
  }
  // user.avatar = avatar.url
  // await user.save({validateBeforeSave:false})

  return res.status(200).json(new ApiResponse(200,user,"Avatar changed successfully",avatar.url))

  })

//change cover image
  export const changecoverImage= asyncHandler(async(req,res)=>{

    //get the cover image from the frontend
    //upload the image to cloudinary
    //update the user in the database

    
    const coverImageLocalpath = req.file.coverImage[0].path;

    const coverImage = await uploadResult(coverImageLocalpath);

    if(!coverImage.url){

      throw new ApiError(400,"Cover image is required")
    }

    const user = User.findByIdAndUpdate(req.userVerfied._id,{
      $set:{
        coverImage:coverImage.url
      }

    },{new:true})

    if(!user){
      throw new ApiError(404,"Verified user not found")
    }


    return res.status(200).json(new ApiResponse(200,user,"cover image change succesfully ",coverImage.url))

  })

  export const subscription=asyncHandler(async(req,res)=>{

      const {username}= req.params

    if(!username?.trim){

      throw new ApiError(400,"Username is required")
    }

    // const user = await User.find({username})

  const channel = User.aggregate([{

    $match:{username:username},
    }
  ,{
    $lookup:{
      from:"subscriptions",
      localField:"_id",
      foreignField:"channel",
      as: "subscribers"
      
    }
  },
  {
    $lookup:{
      from:"subscriptions",
      localField:"_id",
      foreignField:"subscriber",
      as:"subscribeTo"

    }
  },{
    $addFields:{
         subscriberCount:{
          $size:"subscribers"
         },
         subscribeToCount:{
          $size:"subscribeTo"
         },
          subbutton:{
            $cond:[{
            if:{$in:[req.userVerfied._id,"subscribers.subscriber"]},
            then:true,
            else:false,
            }]
         }
    }
  },{$project:{
        fullName:1,
        name:1,
        email:1,
        subscribeCount:1,
        subscribeToCount:1,
        subbutton:1,
        coverImage:1,
        avatar:1,
        createdAt:1,
        updatedAt:1,
       
  }}
  ])   

    




  })