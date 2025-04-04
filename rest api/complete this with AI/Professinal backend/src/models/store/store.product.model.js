import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const productSchema = new Schema({
    // Store information
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CreateStore",
        required: true
    },
    
    // Basic product informations
    productName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    description: {
        type: String,
        trim: true,
        default: ""
    },
    
    // Price and discount
    productPrice: {
        type: Number, // Changed from String to Number
        required: true
    },
    productDiscount: {
        type: Number, // Changed from String to Number
        default: 0
    },
    finalPrice: {
        type: Number,
        default: function() {
            return this.productPrice - (this.productPrice * (this.productDiscount / 100));
        }
    },
    
    // Rating and reviews
    productRating: { // Renamed from productrate for clarity
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    
    // Product variations
    productSizes: {
        type: [String], // Changed to array of strings
        required: true,
        validate: {
            validator: function(v) {
                return v.length > 0;
            },
            message: 'At least one size option is required'
        }
    },
    productColors: {
        type: [String], // Changed to array of strings
        required: true,
        validate: {
            validator: function(v) {
                return v.length > 0;
            },
            message: 'At least one color option is required'
        }
    },
    
    // Inventory
    stock: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Images
    productImages: {
        type: [String],
        required: true,
        validate: {
            validator: function(v) {
                return v.length > 0;
            },
            message: 'At least one product image is required'
        }
    },
    
    // Category and tags
    category: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    tags: {
        type: [String],
        default: []
    },
    
    // Engagement metrics
    clickCount: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    
    // Management
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    isPublished: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

productSchema.plugin(mongooseAggregatePaginate);

// Text index for search functionality
productSchema.index({
    productName: "text",
    description: "text",
    category: "text",
    tags: "text"
});

// Regular indexes for common queries
productSchema.index({ category: 1 });
productSchema.index({ finalPrice: 1 });
productSchema.index({ productRating: -1 });
productSchema.index({ isPublished: 1 });
productSchema.index({ owner: 1 });
productSchema.index({ storeId: 1 });
productSchema.index({ createdAt: -1 });

export default mongoose.model("Product", productSchema);












// import mongoose, { Schema } from "mongoose";
// import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// const productSchema = new Schema({
    
//     // Store information
//     storeId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "CreateStore",
//         required: true
//       },
      

    
//     productname: {
//         type: String,
//         required: true,
//         trim: true,
//         index: true
//     },
//     productrate: {  // Fixed spelling from "catagoury"
//         type: String,
//         required: true,
//         trim: true,
//         index: true
//     },
//     productImage: {  // Changed to camelCase
//         type: [String],
//         required: true,
//       // Added enum for validation
//     },
//     productsizes: {  // Changed to camelCase
//         type: String,
//         required: true,
//         trim: true,
//         index: true
//     },
//     productprice: {  // Changed to camelCase
//         type: String,
//         required: true,
//         trim: true
//     },
//     productDiscount: {  // Changed to camelCase
//         type: String,
//         required: function() { return this.storeType === 'one-product'; }  // Only required for one-product stores
//     },
   
//     productcolor: { 
//         type: String, 
//         required: true 
//     },
//     clickCount: { 
//         type: Number, 
//         default: 0 
//     },

//     likes:{
//     //  likes
//     },

//     owner: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//         required: true
//     },


//     isPublished: {  // Added missing field
//         type: Boolean,
//         default: false
//     }
// }, { timestamps: true });

// productSchema.plugin(mongooseAggregatePaginate);

// // Text index for search functionality
// productSchema.index({
//     storeName: "text",
//     category: "text",
//     productName: "text"
// });

// // Regular indexes for common queries
// productSchema.index({ category: 1 });
// productSchema.index({ storeType: 1 });
// productSchema.index({ isPublished: 1 });
// productSchema.index({ owner: 1 });

// export default mongoose.model("Product", productSchema);  // Changed to CreateStore