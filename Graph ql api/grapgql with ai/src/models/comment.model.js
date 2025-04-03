import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
    {
        content: {
            type: String,
            required: true
        },
        // Using a more generic approach for the content reference
        contentId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        contentType: {
            type: String,
            enum: ["card", "video"],
            required: true
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
)

commentSchema.plugin(mongooseAggregatePaginate)

// Add indexes for frequent queries
commentSchema.index({ contentId: 1, contentType: 1 });
commentSchema.index({ owner: 1 });
commentSchema.index({ createdAt: -1 });

export const Comment = mongoose.model("Comment", commentSchema)