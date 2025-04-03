import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'



//i want to use one of them of them (watsapp,storelink,facebook,instaram)  is required use enum or other to make reuired in enum we select one of them but we can select multiple of them or all or one of them so validation is at lest one of them is required

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
    // addtoFavouret: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Video",
    // }
    
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }],
    avatar: {
        type: String,  //cloudnary url
        required: true
    },

    coverImage: {
        type: String,  //cloudnary url

    },
    refreshToken: {
        type: String,

    },

    whatsapp:{
        type:Number,
        unique:true
    },
     
    storeLink:{
        type:String,
        unique:true
    }
   ,
    facebook:{
        type:String,
        unique:true
    }
    ,
    instagram:{
        type:String,
        unique:true
    },

    productlink:{
        type:String,
    }


    //likevideo:
    //commentvideo:
}, { timestamps: true })

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password, 10)
    next()
})
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
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

// Custom validator to ensure at least one social link is provided
userSchema.pre('validate', function(next) {
    if (
        !this.whatsapp && 
         !this.storeLink && 
        !this.facebook && 
        !this.instagram
    ) {
        this.invalidate('socialLinks', 'At least one social link (WhatsApp, storeLink, Facebook, or Instagram) is required');
    }
    next();
});

export const User = mongoose.model('User', userSchema)
