import mongoose, {Schema} from "mongoose";
import bycrypt from "bcrypt"
import jwt from 'jsonwebtoken'

const userSchema = new Schema({

    username: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        trim: true,
        index: true


    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, "password is required"],
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    videoHistory: {
        type: Schema.Types.ObjectId,
        ref: "Video",
    }
    ,
    avatar: {
        type: String,  //cloudnary url
        required: true
    },

    coverImage: {
        type: String,  //cloudnary url

    },
    refreshToken: {
        type: String,

    }
    //likevideo:
    //commentvideo:
}, { timestamps: true })

userSchema.pre("save", async function (next) {

    if (!this.isModified("password")) return next()
    await bycrypt.hash(this.password, 10)
    next()
})
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bycrypt.compare(password, this.password)
}
userSchema.methods.getAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            fullname: this.fullName,
            username: this.username,
        }
     ,
        process.env.ACCESS_TOKEN_SECRET
    
        , {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    })

}

userSchema.methods.getRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET
   
        , {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
)


}
export const User = mongoose.model('User', userSchema)
