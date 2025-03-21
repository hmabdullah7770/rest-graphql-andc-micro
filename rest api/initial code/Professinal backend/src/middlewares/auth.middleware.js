import jwt from 'jsonwebtoken'
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse} from "../utils/ApiResponse.js"
import { User } from '../models/user.model.js';

const VerfyJwt =(res,req,next)=>{

    //verified the login user
    try{

     const token = res.cookies?.accessToken || res.headers("Authorization")?.replace('Bearer ', '')
       
     if(!token){

        return  ApiError(401 ,"accessToken is not in the header or cookies")
     }

     const decordtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

     if(!decordtoken){

         return ApiError(401, "Token is invalid or expired")
     }
        
     const user = User.findById(decordtoken._id)


        if(!user){

            return ApiError(404,"user not found")
        }

        req.userVerfied = user

        next()
    }
    catch(error){

        return ApiError(401, error)
    }
    }

    export default VerfyJwt