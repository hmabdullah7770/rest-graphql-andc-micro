import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const carouselSchema = new Schema({
    // Store information
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CreateStore",
        required: true
    },
    
    // Big Heading
    bigHeadingText: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    bigHeadingSize: {
        type: String,
        required: function() { return this.bigHeadingText; },
        trim: true
    },
    bigHeadingColor: {
        type: String,
        required: function() { return this.bigHeadingText; },
        trim: true
    },
    bigHeadingBackground: {
        type: String,
        required: function() { return this.bigHeadingText; },
        trim: true
    },
    
    // Small Heading
    smallHeadingText: {
        type: String,
        required: true,
        trim: true
    },
    smallHeadingSize: {
        type: String,
        required: function() { return this.smallHeadingText; },
        trim: true
    },
    smallHeadingColor: {
        type: String,
        required: function() { return this.smallHeadingText; },
        trim: true
    },
    smallHeadingBackgroundColor: {
        type: String,
        required: function() { return this.smallHeadingText; },
        trim: true
    },
    
    // Button styling
    buttonText: {
        type: String,
        required: true,
        trim: true
    },
    buttonTextColor: { 
        type: String,
        default: "black"
    },
    buttonHoverTextColor: { 
        type: String,
        default: "white"
    },
    buttonBackground: { 
        type: String,
        default: "red"
    },
    buttonHoverBackground: { 
        type: String,
        default: "darkred"
    },
    buttonShadow: {
        type: Boolean,
        default: false
    },
    buttonShadowColor: {
        type: String,
        default: "grey",
        required: function() { return this.buttonShadow; }
    },
    buttonBorder: {
        type: Boolean,
        default: false
    },
    buttonBorderColor: {
        type: String,
        required: function() { return this.buttonBorder; }
    },
    buttonBorderSize: {
        type: Number,
        required: function() { return this.buttonBorder; }
    },
    
    // Image handling
    images: { 
        type: [String],
        validate: {
            validator: function(v) {
                return v.length > 0;
            },
            message: 'At least one image is required'
        }
    },
    imageAlt: { 
        type: String, 
        required: true, 
        default: "Banner Background" 
    },
    backgroundImage: {
        type: String,   // cloudinary url
        required: true
    },
    
    // Link handling
    targetUrl: { 
        type: String, 
        required: true 
    },
    
    // Typography
    fontFamily: { 
        type: [String], // Allow multiple fonts (e.g., ["Roboto", "Arial"])
        default: ["Arial"] 
    },
    
    // Owner and metrics
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    clickCount: { 
        type: Number, 
        default: 0 
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    
    // Animation options (commented out but structured properly)
    /*
    animationType: { 
        type: String, 
        enum: ["none", "fade", "slide"], 
        default: "none" 
    },
    animationDuration: { 
        type: Number, 
        default: 0.5 
    }, // Seconds
    animationDelay: { 
        type: Number, 
        default: 0 
    },
    */
    
    // Category for searchability
    category: {
        type: String,
        trim: true,
        index: true
    }
}, { timestamps: true });

carouselSchema.plugin(mongooseAggregatePaginate);

// Text indexes for searching
carouselSchema.index({ 
    bigHeadingText: "text", 
    smallHeadingText: "text", 
    category: "text" 
});

// Regular indexes for common queries
carouselSchema.index({ category: 1 });
// carouselSchema.index({ isPublished: 1 });
carouselSchema.index({ storeId: 1 });
carouselSchema.index({ owner: 1 });
carouselSchema.index({ clickCount: -1 });

export default mongoose.model("Carousel", carouselSchema);
















// import mongoose, { Schema } from "mongoose";
// import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
// // import  {Comment}  from "./comment.model.js";

// const carouselSchema = new Schema({
    
//   // Store information
//  storeId: {
//   type: mongoose.Schema.Types.ObjectId,
//   ref: "CreateStore",
//   required: true
// },
  
  
  
  
//   bigheadingText: {
//         type: String,
//         required: true,
//         trim: true,
//         index: true
//     },

//     bigheadingSize: {
//         type: String,
//         required: true,
//         trim: true,
//         index: true,
//         required: function() { return this.bigheadingText}
//     },
//     bigheadingColor: {
//         type: String,
//         required: true,
//         trim: true,
//         index: true,
//         required: function() { return this.bigheadingText}
//     },
//     bigheadingBackground: {
//         type: String,
//         required: true,
//         trim: true,
//         index: true,
//         required: function() { return this.bigheadingText}

//     },
//     smallheadingText: {
//         type: String,
//         required: true,
//         trim: true,
        
//     },

//     smallheadingSize: {
//         type: String,
//         required: true,
//         trim: true,
//         required: function() { return this.smallheadingText}
//     },
//     smallheadingColor: {
//         type: String,
//         required: true,
//         trim: true,
//         required: function() { return this.smallheadingText}
//     },
//     smallheadingBackgroundcolor: {
//         type: String,
//         required: true,
//         trim: true,
//         required: function() { return this.smallheadingText}
//     },

//     buttonText:{
//     type:String,
//     required:true,

//     },

//     buttonTextColor: { type: String,
//          default: "black"
//      },
//     buttonHoverTextColor: { type: String 
//         ,default: "White"  
//     },
//     buttonBackground: { type: String,
//          default: "red"
//      },
//     buttonHoverBackground: { type: String,
//          default:"darkred"
//      },
    
//     buttonshadow:{
//           type:Boolean,
          
//         },

//         buttonshadowColor:{
//           type:String,
//           default:"grey",
//           required: function() { return this.buttonshadow; }
//         },

//         buttonborder:{
//             type:Boolean,
//              default: "black"
//           },

//           buttonborderColor:{
//             type:String,
//             required: function() { return this.buttonborder; } 
//           },

//           buttonborderSize:{
//               type:Number,
//               required: function() { return this.buttonborder; }
//           },

   
//     owner: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//         required: true
//     },
    

//       images: { 
//         type: [String], 
        
       
//       },

//       ImageAlt: { 
//         type: String, 
//         required: true, 
//         default: "Banner Background" 
//       },

//       targetUrl: { type: String, required: true },



//     BackgroundImage: {
//         type: String,   //cloudnary url
//         required: true
//     },
//     // views: {
//     //     type: Number,
//     //     default: 0,
//     // },
//     isPublished: {
//         type: Boolean,
//         default: true
//     },

//     // animationType: { type: String, enum: ["none", "fade", "slide"], default: "none" },

//     // animationDuration: { type: Number, default: 0.5 }, // Seconds
//     // animationDelay: { type: Number, default: 0 },
    
    
//       // Typography
//       fontFamily: { 
//         type: [String], // Allow multiple fonts (e.g., ["Roboto", "Arial"]
//         default: ["Arial"] 
//       },



//        clickCount: { type: Number, default: 0 }
   
// }, { timestamps: true })




//   carouselSchema.plugin(mongooseAggregatePaginate)

// // ✅ Fix (use actual fields from schema)
// carouselSchema.index({ 
//     bigheadingText: "text", 
//     smallheadingText: "text", 
//     category: "text" 
//   });
  

// // Add regular indexes for common queries
// carouselSchema.index({ category: 1 });
// // cardSchema.index({ category: 1 });
// // carouselSchema.index({ averageRating: -1 });
// // carouselSchema.index({ totalViews: -1 });
// carouselSchema.index({ isPublished: 1 });

// export default mongoose.model("Carousel", carouselSchema)