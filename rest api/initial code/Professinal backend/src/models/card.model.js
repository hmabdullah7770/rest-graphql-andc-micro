import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const cardSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    cardFile: {
        type: String,  //coludnary url
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    // duration: {
    //     type: Number,
    //     required: true
    // },
    thumbnail: {
        type: String,   //cloudnary url
        required: true
    },
    views: {
        type: Number,
        default: 0,
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    // Social links - optional fields that can be included from user profile
    whatsapp: {
        type: Number
    },
    storeLink: {
        type: String
    },
    facebook: {
        type: String
    },
    instagram: {
        type: String
    },
    productlink: {
        type: String
    },
    // Rating statistics
    totalRating: {
        type: Number,
        default: 0
    },
    ratingCount: {
        type: Number,
        default: 0
    },
    averageRating: {
        type: Number,
        default: 0
    },
    // View tracking
    totalViews: {
        type: Number,
        default: 0
    }
}, { timestamps: true })

// Custom validator to ensure at least one social link is provided
cardSchema.pre('validate', function(next) {
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

cardSchema.plugin(mongooseAggregatePaginate)

export default mongoose.model("Card", cardSchema)