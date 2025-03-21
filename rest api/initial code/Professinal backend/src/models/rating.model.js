import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const ratingSchema = new Schema(
    {
        rating: {
            type: Number,
            min: 1,
            max: 5,
            required: true
        },
        contentId: {
            type: Schema.Types.ObjectId,
            required: true
        },
        contentType: {
            type: String,
            enum: ["card", "video"],
            required: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        comment: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

ratingSchema.index({ contentId: 1, contentType: 1, owner: 1 }, { unique: true });

ratingSchema.plugin(mongooseAggregatePaginate);

export const Rating = mongoose.model("Rating", ratingSchema); 