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

  const { username, email, password, fullName, whatsapp, storeLink, facebook, instagram, productlink } = req.body;
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

  // Check if at least one social link is provided
  if (!whatsapp && !storeLink && !facebook && !instagram) {
    throw new ApiError(400, "At least one social link (WhatsApp, storeLink, Facebook, or Instagram) is required");
  }

  const CheckUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  console.log("USer is :", CheckUser);

  if (CheckUser) {
    throw new ApiError(409, "User already exist");
  }

  // Check for duplicate social links if provided
  const socialLinksQuery = [];
  if (whatsapp) socialLinksQuery.push({ whatsapp });
  if (storeLink) socialLinksQuery.push({ storeLink });
  if (facebook) socialLinksQuery.push({ facebook });
  if (instagram) socialLinksQuery.push({ instagram });

  if (socialLinksQuery.length > 0) {
    const existingSocialLink = await User.findOne({
      $or: socialLinksQuery
    });

    if (existingSocialLink) {
      throw new ApiError(409, "One of the social links is already in use");
    }
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
    whatsapp,
    storeLink,
    facebook,
    instagram,
    productlink
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
  const {email,fullName, whatsapp, storeLink, facebook, instagram, productlink } = req.body

  if(!email || !fullName){
    throw new ApiError(400,"Email and fullname is required")

  }

  // Check if at least one social link will be available after update
  // First get current user data
  const currentUser = await User.findById(req.userVerfied._id);
  
  // Determine which social links will be present after update
  const willHaveWhatsapp = whatsapp !== undefined ? whatsapp : currentUser.whatsapp;
  const willHaveStoreLink = storeLink !== undefined ? storeLink : currentUser.storeLink;
  const willHaveFacebook = facebook !== undefined ? facebook : currentUser.facebook;
  const willHaveInstagram = instagram !== undefined ? instagram : currentUser.instagram;

  // Check if at least one social link will be present
  if (!willHaveWhatsapp && !willHaveStoreLink && !willHaveFacebook && !willHaveInstagram) {
    throw new ApiError(400, "At least one social link (WhatsApp, storeLink, Facebook, or Instagram) is required");
  }

  // Check for duplicate social links if updating any
  const socialLinksQuery = [];
  if (whatsapp && whatsapp !== currentUser.whatsapp) socialLinksQuery.push({ whatsapp });
  if (storeLink && storeLink !== currentUser.storeLink) socialLinksQuery.push({ storeLink });
  if (facebook && facebook !== currentUser.facebook) socialLinksQuery.push({ facebook });
  if (instagram && instagram !== currentUser.instagram) socialLinksQuery.push({ instagram });

  if (socialLinksQuery.length > 0) {
    const existingSocialLink = await User.findOne({
      $or: socialLinksQuery,
      _id: { $ne: req.userVerfied._id } // Exclude current user
    });

    if (existingSocialLink) {
      throw new ApiError(409, "One of the social links is already in use by another user");
    }
  }

  // Create update object with only provided fields
  const updateData = {
    email,
    fullName
  };
  
  if (whatsapp !== undefined) updateData.whatsapp = whatsapp;
  if (storeLink !== undefined) updateData.storeLink = storeLink;
  if (facebook !== undefined) updateData.facebook = facebook;
  if (instagram !== undefined) updateData.instagram = instagram;
  if (productlink !== undefined) updateData.productlink = productlink;

  const user = await User.findByIdAndUpdate(
    req.userVerfied._id,
    { $set: updateData },
    { new: true }
  );

  if (!user) {
    throw new ApiError(404, "Verified user not found");
  }

  return res.status(200).json(new ApiResponse(200, user, "User updated successfully"));
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

  export const getWatchHistory = asyncHandler(async(req, res) => {
      const user = await User.aggregate([
          {
              $match: {
                  _id: new mongoose.Types.ObjectId(req.user._id)
              }
          },
          {
              $lookup: {
                  from: "videos",
                  localField: "watchHistory",
                  foreignField: "_id",
                  as: "watchHistory",
                  pipeline: [
                      {
                          $lookup: {
                              from: "users",
                              localField: "owner",
                              foreignField: "_id",
                              as: "owner",
                              pipeline: [
                                  {
                                      $project: {
                                          fullName: 1,
                                          username: 1,
                                          avatar: 1
                                      }
                                  }
                              ]
                          }
                      },
                      {
                          $addFields:{
                              owner:{
                                  $first: "$owner"
                              }
                          }
                      }
                  ]
              }
          }
      ])
  
      return res
      .status(200)
      .json(
          new ApiResponse(
              200,
              user[0].watchHistory,
              "Watch history fetched successfully"
          )
      )
  })
  