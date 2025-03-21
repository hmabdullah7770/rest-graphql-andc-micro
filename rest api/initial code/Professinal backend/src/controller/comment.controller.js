import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import Card from "../models/card.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

// Helper function to get the appropriate model based on contentType
const getContentModel = (contentType) => {
    switch(contentType) {
        case "card":
            return Card;
        case "video":
            return Video;
        default:
            throw new ApiError(400, "Invalid content type");
    }
};

const getComments = asyncHandler(async (req, res) => {
    const {contentId, contentType} = req.params;
    const {page = 1, limit = 10, sortBy = "createdAt", sortType = "desc"} = req.query;
    
    if (!isValidObjectId(contentId)) {
        throw new ApiError(400, "Invalid content ID");
    }
    
    if (!["card", "video"].includes(contentType)) {
        throw new ApiError(400, "Invalid content type");
    }
    
    // Get the appropriate model
    const ContentModel = getContentModel(contentType);
    
    // Check if content exists and is published
    const content = await ContentModel.findOne({_id: contentId, isPublished: true});
    
    if (!content) {
        throw new ApiError(404, `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} not found`);
    }
    
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;
    
    // Prepare sort options
    const sortOptions = {};
    
    if (sortBy) {
        sortOptions[sortBy] = sortType === "desc" ? -1 : 1;
    } else {
        sortOptions.createdAt = -1; // Default sort by newest first
    }
    
    // Get comments with populated user info
    const commentsAggregate = Comment.aggregate([
        {
            $match: {
                contentId: new mongoose.Types.ObjectId(contentId),
                contentType
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $arrayElemAt: ["$owner", 0] }
            }
        },
        {
            $sort: sortOptions
        },
        {
            $skip: skip
        },
        {
            $limit: limitNumber
        }
    ]);
    
    const result = await commentsAggregate.exec();
    
    // Get total count for pagination
    const totalComments = await Comment.countDocuments({contentId, contentType});
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalComments / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;
    
    return res.status(200).json(
        new ApiResponse(200, {
            comments: result,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                totalComments,
                totalPages,
                hasNextPage,
                hasPrevPage
            }
        }, "Comments fetched successfully")
    );
});

const addComment = asyncHandler(async (req, res) => {
    const { contentId } = req.params;
    const { content } = req.body;
    
    if (!isValidObjectId(contentId)) {
        throw new ApiError(400, "Invalid content ID");
    }
    
    // Try to find content in both Card and Video collections
    const card = await Card.findById(contentId);
    const video = await Video.findById(contentId);
    
    let contentType;
    let foundContent;
    
    if (card) {
        contentType = "card";
        foundContent = card;
    } else if (video) {
        contentType = "video";
        foundContent = video;
    } else {
        throw new ApiError(404, "Content not found");
    }
    
    // Check if content is published
    if (!foundContent.isPublished) {
        throw new ApiError(404, "Content not found or not published");
    }
    
    // Create comment
    const comment = await Comment.create({
        content,
        contentId,
        contentType,
        owner: req.userVerfied._id
    });
    
    // Return comment with user info
    const populatedComment = await Comment.findById(comment._id).populate("owner", "username fullName avatar");
    
    return res.status(201).json(
        new ApiResponse(201, populatedComment, "Comment added successfully")
    );
});

const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    const {content} = req.body;
    
    // Validate input
    if (!content || !content.trim()) {
        throw new ApiError(400, "Comment content is required");
    }
    
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }
    
    // Find comment
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
    
    // Check if user is the owner of comment
    if (comment.owner.toString() !== req.userVerfied._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this comment");
    }
    
    // Update comment
    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        { content },
        { new: true }
    ).populate("owner", "username fullName avatar");
    
    return res.status(200).json(
        new ApiResponse(200, updatedComment, "Comment updated successfully")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }
    
    // Find comment
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
    
    // Check if user is the owner of comment
    if (comment.owner.toString() !== req.userVerfied._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this comment");
    }
    
    // Delete the comment
    await Comment.findByIdAndDelete(commentId);
    
    return res.status(200).json(
        new ApiResponse(200, {}, "Comment deleted successfully")
    );
});

export {
    getComments,
    addComment,
    updateComment,
    deleteComment
}
