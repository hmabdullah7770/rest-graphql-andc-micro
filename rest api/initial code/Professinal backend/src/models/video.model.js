import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({

    videoFile: {
        type: String,  //coludnary url
        required: true
    },
    // title: {
    //     type: String,
    //     required: true,
    // },
    // discription: {
    //     type: String,

    // },
    // owner: {
    //     type: Schema.Types.ObjectId,
    //     ref: 'User'
    // },
    duration: {
        type: Number,
        required: true
    },
    // thumbnail: {
    //     type: String,   //cloudnary url
    //     required: true
    // },
    onclicks: {
        type: Number,
        default: 0,
    },
    Uploaded: {
        type: Boolean,
        default: true,
    }



}, { timestamps: true })


videoSchema.plugin(mongooseAggregatePaginate)


export const Video = mongoose.model('Video', videoSchema)