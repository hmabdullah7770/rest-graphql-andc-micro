import mongoose from "mongoose";

const followlistSchema = new mongoose.Schema({
    followers: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",  // Reference to User model as string
        required: true
    },
    following: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",  // Reference to User model as string
        required: true
    }
}, {timestamps: true});

// Add index for frequent queries
followlistSchema.index({ subscriber: 1, channel: 1 }, { unique: true });

export const Followlist = mongoose.model("Followlist", followlistSchema);