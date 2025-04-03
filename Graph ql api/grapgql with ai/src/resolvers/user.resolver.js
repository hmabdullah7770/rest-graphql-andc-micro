// user.resolver.js
import { User } from '../models/user.model.js';
import { uploadResult } from '../config/cloudinary.js';
import { generateAccessTokenAndRefreshToken } from '../utils/generateATandRT.js';

export const UsersResolver = {
  Query: {
    users: async () => {
      try {
        const users = await User.find({}).select('-password -refreshToken');
        return {
          success: true,
          total: users.length,
          users
        };
      } catch (error) {
        return {
          success: false,
          message: 'Failed to fetch users',
          error: error.message
        };
      }
    },

    user: async (_, { id }) => {
      try {
        const user = await User.findById(id).select('-password -refreshToken');
        if (!user) throw new Error('User not found');
        return {
          success: true,
          user
        };
      } catch (error) {
        return {
          success: false,
          message: 'Failed to fetch user',
          error: error.message
        };
      }
    },

    currentUser: async (_, __, context) => {
      try {
        const user = await User.findById(context.user.id).select('-password -refreshToken');
        if (!user) throw new Error('User not found');
        return {
          success: true,
          user
        };
      } catch (error) {
        return {
          success: false,
          message: 'Failed to fetch current user',
          error: error.message
        };
      }
    },

    getUser: async (_, { username }) => {
      try {
        const user = await User.findOne({ username }).select('-password -refreshToken');
        if (!user) throw new Error('User not found');
        return {
          success: true,
          user
        };
      } catch (error) {
        return {
          success: false,
          message: 'Failed to fetch user by username',
          error: error.message
        };
      }
    },

    // watchHistory: async (_, __, context) => {
    //   try {
    //     const user = await User.findById(context.user.id)
    //       .populate('watchHistory')
    //       .select('watchHistory');
    //     return {
    //       success: true,
    //       videos: user.watchHistory
    //     };
    //   } catch (error) {
    //     return {
    //       success: false,
    //       message: 'Failed to fetch watch history',
    //       error: error.message
    //     };
    //   }
    // },

    followList: async (_, { username }) => {
      try {
        // Implement your aggregation logic here
        const result = await User.aggregate([/* your aggregation pipeline */]);
        return {
          success: true,
          result
        };
      } catch (error) {
        return {
          success: false,
          message: 'Failed to fetch follow list',
          error: error.message
        };
      }
    }
  },

  Mutation: {
    register: async (_, { input, avatar, coverImage }) => {
      try {
        const existingUser = await User.findOne({ 
          $or: [{ email: input.email }, { username: input.username }] 
        });
        if (existingUser) throw new Error('User already exists');

        const [avatarUrl, coverImageUrl] = await Promise.all([
          uploadResult(avatar),
          coverImage ? uploadResult(coverImage) : null
        ]);

        const user = await User.create({
          ...input,
          avatar: avatarUrl,
          coverImage: coverImageUrl
        });

        const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user.id);
        
        return {
          success: true,
          accessToken,
          refreshToken,
          user: user.toObject()
        };
      } catch (error) {
        return {
          success: false,
          message: 'Registration failed',
          error: error.message
        };
      }
    },

    login: async (_, { email, username, password }) => {
      try {
        const user = await User.findOne({ $or: [{ email }, { username }] });
        if (!user) throw new Error('Invalid credentials');
        
        const isPasswordValid = await user.isPasswordCorrect(password);
        if (!isPasswordValid) throw new Error('Invalid credentials');

        const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user.id);
        
        return {
          success: true,
          accessToken,
          refreshToken,
          user: user.toObject()
        };
      } catch (error) {
        return {
          success: false,
          message: 'Login failed',
          error: error.message
        };
      }
    },

    updateUser: async (_, { input }, context) => {
      try {
        const socialLinks = ['whatsapp', 'storeLink', 'facebook', 'instagram'];
        const hasSocialLink = socialLinks.some(field => input[field]);
        
        if (!hasSocialLink) throw new Error('At least one social link is required');

        const updatedUser = await User.findByIdAndUpdate(
          context.user.id,
          input,
          { new: true, runValidators: true }
        ).select('-password -refreshToken');

        return {
          success: true,
          user: updatedUser.toObject()
        };
      } catch (error) {
        return {
          success: false,
          message: 'Update failed',
          error: error.message
        };
      }
    },

    // Add other mutations following the same pattern
    changePassword: async (_, { oldPassword, newPassword }, context) => {
      try {
        // Implement password change logic
        return {
          success: true,
          message: 'Password changed successfully'
        };
      } catch (error) {
        return {
          success: false,
          message: 'Password change failed',
          error: error.message
        };
      }
    }
  }
};