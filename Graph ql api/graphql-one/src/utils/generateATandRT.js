import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

const generateAccessToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
};

const generateRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
};

export const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const accessToken = generateAccessToken(userId);
        const refreshToken = generateRefreshToken(userId);

        // Store refresh token in user document
        const user = await User.findById(userId);
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return {
            accessToken,
            refreshToken
        };
    } catch (error) {
        throw new Error("Error while generating tokens: " + error.message);
    }
};