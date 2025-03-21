import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    
    // Validate channelId
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }
    
    // Check if channel exists
    const channel = await User.findById(channelId)
    
    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }
    
    // User cannot subscribe to themselves
    if (channelId === req.userVerfied._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to yourself")
    }
    
    // Check if subscription already exists
    const existingSubscription = await Subscription.findOne({
        subscriber: req.userVerfied._id,
        channel: channelId
    })
    
    // If subscription exists, remove it (unsubscribe)
    if (existingSubscription) {
        await Subscription.findByIdAndDelete(existingSubscription._id)
        
        return res.status(200).json(
            new ApiResponse(
                200, 
                { subscribed: false }, 
                "Unsubscribed successfully"
            )
        )
    }
    
    // If subscription doesn't exist, create it (subscribe)
    const subscription = await Subscription.create({
        subscriber: req.userVerfied._id,
        channel: channelId
    })
    
    if (!subscription) {
        throw new ApiError(500, "Failed to subscribe")
    }
    
    return res.status(200).json(
        new ApiResponse(
            200, 
            { subscribed: true }, 
            "Subscribed successfully"
        )
    )
})

// Controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const {page = 1, limit = 10} = req.query
    
    // Validate channelId
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }
    
    // Check if channel exists
    const channel = await User.findById(channelId)
    
    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }
    
    const pageNumber = parseInt(page, 10)
    const limitNumber = parseInt(limit, 10)
    const skip = (pageNumber - 1) * limitNumber
    
    // Aggregate to get subscribers with user details
    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                            email: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                subscriber: { $arrayElemAt: ["$subscriber", 0] }
            }
        },
        {
            $sort: { createdAt: -1 } // Latest subscribers first
        },
        {
            $skip: skip
        },
        {
            $limit: limitNumber
        }
    ])
    
    // Get total count for pagination
    const totalSubscribers = await Subscription.countDocuments({
        channel: channelId
    })
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalSubscribers / limitNumber)
    const hasNextPage = pageNumber < totalPages
    const hasPrevPage = pageNumber > 1
    
    return res.status(200).json(
        new ApiResponse(
            200, 
            {
                subscribers,
                pagination: {
                    page: pageNumber,
                    limit: limitNumber,
                    totalSubscribers,
                    totalPages,
                    hasNextPage,
                    hasPrevPage
                }
            }, 
            "Channel subscribers fetched successfully"
        )
    )
})

// Controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const {subscriberId} = req.params
    const {page = 1, limit = 10} = req.query
    
    // Validate subscriberId
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID")
    }
    
    // Check if subscriber exists
    const subscriber = await User.findById(subscriberId)
    
    if (!subscriber) {
        throw new ApiError(404, "Subscriber not found")
    }
    
    const pageNumber = parseInt(page, 10)
    const limitNumber = parseInt(limit, 10)
    const skip = (pageNumber - 1) * limitNumber
    
    // Aggregate to get channels with user details
    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                            email: 1,
                            coverImage: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                channel: { $arrayElemAt: ["$channel", 0] }
            }
        },
        {
            $sort: { createdAt: -1 } // Latest subscriptions first
        },
        {
            $skip: skip
        },
        {
            $limit: limitNumber
        }
    ])
    
    // Get total count for pagination
    const totalSubscribedChannels = await Subscription.countDocuments({
        subscriber: subscriberId
    })
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalSubscribedChannels / limitNumber)
    const hasNextPage = pageNumber < totalPages
    const hasPrevPage = pageNumber > 1
    
    return res.status(200).json(
        new ApiResponse(
            200, 
            {
                subscribedChannels,
                pagination: {
                    page: pageNumber,
                    limit: limitNumber,
                    totalSubscribedChannels,
                    totalPages,
                    hasNextPage,
                    hasPrevPage
                }
            }, 
            "Subscribed channels fetched successfully"
        )
    )
})

// Check if user is subscribed to a channel
const isSubscribed = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    
    // Validate channelId
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }
    
    // Check if subscription exists
    const subscription = await Subscription.findOne({
        subscriber: req.userVerfied._id,
        channel: channelId
    })
    
    return res.status(200).json(
        new ApiResponse(
            200,
            { subscribed: !!subscription },
            "Subscription status fetched successfully"
        )
    )
})

// Get subscription count
const getChannelStats = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    
    // Validate channelId
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }
    
    // Check if channel exists
    const channel = await User.findById(channelId)
    
    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }
    
    // Get subscriber count
    const subscriberCount = await Subscription.countDocuments({
        channel: channelId
    })
    
    // Get subscribed to count
    const subscribedToCount = await Subscription.countDocuments({
        subscriber: channelId
    })
    
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                subscriberCount,
                subscribedToCount
            },
            "Channel stats fetched successfully"
        )
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
    isSubscribed,
    getChannelStats
}