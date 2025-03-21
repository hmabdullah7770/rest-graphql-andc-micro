import { buildSchema } from "graphql";

export const usersGQLSchema = buildSchema(`
    scalar Upload

    type User {
        id: String!
        username: String!
        email: String!
        fullName: String!
        avatar: String!
        coverImage: String
        whatsapp: Int
        storeLink: String
        facebook: String
        instagram: String
        productlink: String
        refreshToken: String
        createdAt: String!
        updatedAt: String!
    }

    input UserInput {
        username: String!
        email: String!
        password: String!
        fullName: String!
        whatsapp: Int
        storeLink: String
        facebook: String
        instagram: String
        productlink: String
    }

    input SocialLinks {
        whatsapp: Int
        storeLink: String
        facebook: String
        instagram: String
    }

    input UserUpdateInput {
        email: String
        fullName: String
        whatsapp: Int
        storeLink: String
        facebook: String
        instagram: String
        productlink: String
    }

    type AuthPayload {
        accessToken: String!
        refreshToken: String!
        user: User!
    }

    type UsersResponse {
        success: Boolean!
        total: Int
        users: [User!]
        message: String
        error: String
    }

    type UserResponse {
        success: Boolean!
        user: User
        message: String
        error: String
    }

    type Query {
        users: UsersResponse
        user(id: String!): UserResponse
        currentUser: UserResponse
        getUser(username: String!): UserResponse
        followList(username: String!): UserResponse
    }

    type Mutation {
        register(
            input: UserInput!
            avatar: Upload!
            coverImage: Upload
        ): AuthPayload
        login(email: String, username: String, password: String!): AuthPayload
        logout: Boolean
        refreshToken: AuthPayload
        changePassword(oldPassword: String!, newPassword: String!): Boolean
        updateUser(input: UserUpdateInput!): User
        changeAvatar(avatar: Upload!): User
        changeCoverImage(coverImage: Upload!): User
        forgotPassword(email: String!): Boolean
        resetPassword(email: String!, otp: String!, newPassword: String!): Boolean
    }
`);