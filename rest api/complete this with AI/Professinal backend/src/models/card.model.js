import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import  {Comment}  from "./comment.model.js";

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
    // cardFile: {
    //     type: String,  //coludnary url
    //     required: true
    // },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
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


// In card.model.js
cardSchema.static('findByIdAndDelete', async function(id) {
    // First delete all comments associated with this card
    await Comment.deleteMany({ contentId: id, contentType: "card" });
    
    // Then delete the card
    return this.findOneAndDelete({ _id: id });
  });


// Custom validator to ensure at least one social link is provided
// cardSchema.pre('validate', function(next) {
//     if (
//         !this.whatsapp && 
//         !this.storeLink && 
//         !this.facebook && 
//         !this.instagram
//     ) {
//         this.invalidate('socialLinks', 'At least one social link (WhatsApp, storeLink, Facebook, or Instagram) is required');
//     }
//     next();
// });

cardSchema.plugin(mongooseAggregatePaginate)

// Add text indexes for search
cardSchema.index({ title: "text", description: "text" });


// Add regular indexes for common queries
cardSchema.index({ owner: 1 });
cardSchema.index({ averageRating: -1 });
cardSchema.index({ totalViews: -1 });
cardSchema.index({ isPublished: 1 });

export default mongoose.model("Card", cardSchema)