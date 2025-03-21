import mongoose, {isValidObjectId} from "mongoose"
import Card from "../models/card.model.js"
import User from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

//this like an instagram or facebook post (i.e person post the the thir post other can see only and the person who create that post belongs to that person and he can only update and delete their post )

//this is the varified user ID ==> req.userVerfied._id (MEANS USER WHO HAVE ACCESS TOKEN AND REFRESH TOKEN)
// i will provide you the user model and controller so that you get the user details only a user who is verfied can create the card and   the card belongs to his profile he can update and delete only the card he create not others 
//I tell you the task unverifed or vrifed user can do search cards
//verified user can only create cards
//unverified and verfied user can see the cards
//the user who create the card can update and delete the card
//use cloudinary to upload the images
//use aggragation where they are batter to use as your chose to use aggrgation or sub aggrigation piplines
//see the user controller so you can under stand how i write the code and how  i do the task use aggrigation where it only required

const getAllCards = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "averageRating", sortType = "desc", userId } = req.query
    
    // Convert page and limit to numbers
    const pageNumber = parseInt(page, 10)
    const limitNumber = parseInt(limit, 10)
    
    // Calculate skip value for pagination
    const skip = (pageNumber - 1) * limitNumber
    
    // Prepare match stage for aggregation
    const matchStage = {}
    
    // Add search query if provided
    if (query) {
        matchStage.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ]
    }
    
    // Add userId filter if provided
    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user ID")
        }
        matchStage.owner = new mongoose.Types.ObjectId(userId)
    }
    
    // Add isPublished filter - only show published cards
    matchStage.isPublished = true
    
    // Prepare sort options
    const sortOptions = {}
    
    if (sortBy === "averageRating") {
        // First sort by averageRating, then by totalViews for cards with no ratings
        sortOptions.averageRating = sortType === "desc" ? -1 : 1
        sortOptions.totalViews = sortType === "desc" ? -1 : 1
    } else if (sortBy === "totalViews") {
        sortOptions.totalViews = sortType === "desc" ? -1 : 1
    } else if (sortBy) {
        sortOptions[sortBy] = sortType === "desc" ? -1 : 1
    } else {
        // Default sort by rating, then views
        sortOptions.averageRating = -1
        sortOptions.totalViews = -1
    }
    
    // Execute aggregation pipeline
    const cards = await Card.aggregate([
        {
            $match: matchStage
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
    ])
    
    // Get total count for pagination info
    const totalCards = await Card.countDocuments(matchStage)
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCards / limitNumber)
    const hasNextPage = pageNumber < totalPages
    const hasPrevPage = pageNumber > 1
    
    // Return response
    return res.status(200).json(
        new ApiResponse(200, {
            cards,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                totalCards,
                totalPages,
                hasNextPage,
                hasPrevPage
            }
        }, "Cards fetched successfully")
    )
})

const publishCard = asyncHandler(async (req, res) => {
    const { title, description, whatsapp, storeLink, facebook, instagram, productlink } = req.body;
    
    // Validation
    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }
    
    // Get the user
    const user = await User.findById(req.userVerfied._id);
    
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    
    // Check which social links the user wants to include
    const includeWhatsapp = whatsapp === true;
    const includeStoreLink = storeLink === true;
    const includeFacebook = facebook === true;
    const includeInstagram = instagram === true;
    
    // Check if at least one social link is selected to be included
    if (!includeWhatsapp && !includeStoreLink && !includeFacebook && !includeInstagram) {
        throw new ApiError(400, "At least one social link must be selected");
    }
    
    // Validate that user has the social links they're trying to include
    if (includeWhatsapp && !user.whatsapp) {
        throw new ApiError(400, "You don't have a WhatsApp number in your profile");
    }
    
    if (includeStoreLink && !user.storeLink) {
        throw new ApiError(400, "You don't have a store link in your profile");
    }
    
    if (includeFacebook && !user.facebook) {
        throw new ApiError(400, "You don't have a Facebook link in your profile");
    }
    
    if (includeInstagram && !user.instagram) {
        throw new ApiError(400, "You don't have an Instagram link in your profile");
    }
    
    // Handle thumbnail upload
    if (!req.file || !req.file.path) {
        throw new ApiError(400, "Thumbnail is required");
    }
    
    const thumbnailLocalPath = req.file.path;
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    
    if (!thumbnail || !thumbnail.url) {
        throw new ApiError(500, "Error uploading thumbnail to cloudinary");
    }
    
    // Create the card with only the selected social links
    const cardData = {
        title,
        description,
        thumbnail: thumbnail.url,
        owner: req.userVerfied._id,
    };
    
    // Only include the social links that were selected and exist in user profile
    if (includeWhatsapp) cardData.whatsapp = user.whatsapp;
    if (includeStoreLink) cardData.storeLink = user.storeLink;
    if (includeFacebook) cardData.facebook = user.facebook;
    if (includeInstagram) cardData.instagram = user.instagram;
    if (productlink) cardData.productlink = user.productlink;
    
    const card = await Card.create(cardData);
    
    // Get the created card with populated owner
    const createdCard = await Card.findById(card._id).populate("owner", "username fullName avatar");
    
    if (!createdCard) {
        throw new ApiError(500, "Something went wrong while creating the card");
    }
    
    return res.status(201).json(
        new ApiResponse(201, createdCard, "Card published successfully")
    );
})

const getCardById = asyncHandler(async (req, res) => {
    const { cardId } = req.params
    
    // Validate cardId
    if (!isValidObjectId(cardId)) {
        throw new ApiError(400, "Invalid card ID");
    }
    
    // Use aggregation to get card with owner details
    const card = await Card.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(cardId),
                isPublished: true // Only fetch published cards
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
        }
    ])
    
    // Check if card exists
    if (!card || card.length === 0) {
        throw new ApiError(404, "Card not found");
    }
    
    return res.status(200).json(
        new ApiResponse(200, card[0], "Card fetched successfully")
    );
})

const updateCard = asyncHandler(async (req, res) => {
    const { cardId } = req.params;
    const { title, description, whatsapp, storeLink, facebook, instagram, productlink } = req.body;
    
    // Validate cardId
    if (!isValidObjectId(cardId)) {
        throw new ApiError(400, "Invalid card ID");
    }
    
    // Find the card
    const card = await Card.findById(cardId);
    
    if (!card) {
        throw new ApiError(404, "Card not found");
    }
    
    // Check if the user is the owner of the card
    if (card.owner.toString() !== req.userVerfied._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this card");
    }
    
    // Get the user to verify they have the social links they're trying to use
    const user = await User.findById(req.userVerfied._id);
    
    // Validate that user has the social links they're trying to use
    if (whatsapp !== undefined && whatsapp && !user.whatsapp) {
        throw new ApiError(400, "You don't have a WhatsApp number in your profile");
    }
    
    if (storeLink !== undefined && storeLink && !user.storeLink) {
        throw new ApiError(400, "You don't have a store link in your profile");
    }
    
    if (facebook !== undefined && facebook && !user.facebook) {
        throw new ApiError(400, "You don't have a Facebook link in your profile");
    }
    
    if (instagram !== undefined && instagram && !user.instagram) {
        throw new ApiError(400, "You don't have an Instagram link in your profile");
    }
    
    // Check if at least one social link will be present after update
    const willHaveWhatsapp = whatsapp !== undefined ? whatsapp : card.whatsapp;
    const willHaveStoreLink = storeLink !== undefined ? storeLink : card.storeLink;
    const willHaveFacebook = facebook !== undefined ? facebook : card.facebook;
    const willHaveInstagram = instagram !== undefined ? instagram : card.instagram;
    
    if (!willHaveWhatsapp && !willHaveStoreLink && !willHaveFacebook && !willHaveInstagram) {
        throw new ApiError(400, "At least one social link (WhatsApp, storeLink, Facebook, or Instagram) is required");
    }
    
    // Handle thumbnail upload if provided
    let thumbnailUrl = card.thumbnail;
    
    if (req.file && req.file.path) {
        const thumbnail = await uploadOnCloudinary(req.file.path);
        
        if (!thumbnail || !thumbnail.url) {
            throw new ApiError(500, "Error uploading thumbnail to cloudinary");
        }
        
        thumbnailUrl = thumbnail.url;
    }
    
    // Update the card
    const updateData = {
        ...(title && { title }),
        ...(description && { description }),
        ...(thumbnailUrl !== card.thumbnail && { thumbnail: thumbnailUrl }),
        ...(whatsapp !== undefined && { whatsapp: whatsapp ? user.whatsapp : null }),
        ...(storeLink !== undefined && { storeLink: storeLink ? user.storeLink : null }),
        ...(facebook !== undefined && { facebook: facebook ? user.facebook : null }),
        ...(instagram !== undefined && { instagram: instagram ? user.instagram : null }),
        ...(productlink !== undefined && { productlink: productlink ? user.productlink : null })
    };
    
    const updatedCard = await Card.findByIdAndUpdate(
        cardId,
        { $set: updateData },
        { new: true }
    ).populate("owner", "username fullName avatar");
    
    return res.status(200).json(
        new ApiResponse(200, updatedCard, "Card updated successfully")
    );
})

const deleteCard = asyncHandler(async (req, res) => {
    const { cardId } = req.params
    
    // Validate cardId
    if (!isValidObjectId(cardId)) {
        throw new ApiError(400, "Invalid card ID");
    }
    
    // Find the card
    const card = await Card.findById(cardId);
    
    if (!card) {
        throw new ApiError(404, "Card not found");
    }
    
    // Check if the user is the owner of the card
    if (card.owner.toString() !== req.userVerfied._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this card");
    }
    
    // Delete the card
    await Card.findByIdAndDelete(cardId);
    
    return res.status(200).json(
        new ApiResponse(200, {}, "Card deleted successfully")
    );
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { cardId } = req.params
    
    // Validate cardId
    if (!isValidObjectId(cardId)) {
        throw new ApiError(400, "Invalid card ID");
    }
    
    // Find the card
    const card = await Card.findById(cardId);
    
    if (!card) {
        throw new ApiError(404, "Card not found");
    }
    
    // Check if the user is the owner of the card
    if (card.owner.toString() !== req.userVerfied._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this card");
    }
    
    // Toggle the publish status
    card.isPublished = !card.isPublished;
    
    // Save the card
    await card.save();
    
    return res.status(200).json(
        new ApiResponse(
            200, 
            { isPublished: card.isPublished }, 
            `Card ${card.isPublished ? 'published' : 'unpublished'} successfully`
        )
    );
})

// New function to increment view count when a social link is clicked
const incrementSocialLinkView = asyncHandler(async (req, res) => {
    const { cardId, linkType } = req.params
    
    if (!isValidObjectId(cardId)) {
        throw new ApiError(400, "Invalid card ID")
    }
    
    if (!["whatsapp", "storeLink", "facebook", "instagram", "productlink"].includes(linkType)) {
        throw new ApiError(400, "Invalid link type")
    }
    
    // Find the card
    const card = await Card.findById(cardId)
    
    if (!card) {
        throw new ApiError(404, "Card not found")
    }
    
    // Check if the requested link type exists on this card
    if (!card[linkType]) {
        throw new ApiError(404, "This card doesn't have the requested social link")
    }
    
    // Increment view count
    card.totalViews += 1
    await card.save()
    
    // Return the link URL
    return res.status(200).json(
        new ApiResponse(200, { 
            url: card[linkType],
            totalViews: card.totalViews
        }, "View counted and link retrieved")
    )
})

export {
    getAllCards,
    publishCard,
    getCardById,
    updateCard,
    deleteCard,
    togglePublishStatus,
    incrementSocialLinkView
}
