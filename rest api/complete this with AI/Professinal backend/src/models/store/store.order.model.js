import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// Create a schema for individual order items
const OrderItemSchema = new Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  }
});

const orderSchema = new Schema({
  // Customer information
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false // Optional if guest checkout is allowed
  },
  username: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  whatsapp: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  // Shipping information
  address: {
    street: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    zipCode: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true,
      default: "Pakistan" // Default can be changed
    }
  },
  
  // Order details with array of items
  items: [OrderItemSchema],
  
  // Order summary
  totalItems: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  
  // Store information
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CreateStore",
    required: true
  },
  
  // Order status
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cod', 'online', 'upi'],
    default: 'cod'
  },
  
  paymentStatus: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  
  isPublished: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

orderSchema.plugin(mongooseAggregatePaginate);

// Text indexes for searching
orderSchema.index({
  username: "text",
  fullName: "text",
  "items.productName": "text"
});

// Regular indexes for common queries
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ storeId: 1 });
orderSchema.index({ customerId: 1 });
orderSchema.index({ createdAt: -1 }); // For sorting by newest orders

export default mongoose.model("Order", orderSchema);
























// import mongoose, { Schema } from "mongoose";
// import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// const ordereSchema = new Schema({
//     username: {
//         type: String,
//         required: true,
//         trim: true,
//         index: true
//     },
//     fullname: {  // Fixed spelling from "catagoury"
//         type: String,
//         required: true,
//         trim: true,
//         index: true
//     },
//     whatsapp: {  // Changed to camelCase
//         type: String,
//         required: true,
//         trim: true,
//         index: true,
//         enum: ['nesh', 'one-product', 'multiple-product']  // Added enum for validation
//     },
//     phoneno: {  // Changed to camelCase
//         type: String,
//         required: true,
//         trim: true,
//         index: true
//     },
//     address: {  // Changed to camelCase
//         type: String,
//         required: true,
//         trim: true
//     },
//     prductname: {  // Changed to camelCase
//         type: String,
//         required: function() { return this.storeType === 'one-product'; }  // Only required for one-product stores
//     },
//     productsize: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//         required: true
//     },
//     productcolor: { 
//         type: String, 
//         required: true 
//     },
//    quantityofproduct: { 
//         type: Number, 
//         default: 0 
//     },

//     totalQuantity: { 
//         type: Number, 
//         default: 0 
//     },

//     // likes:{
//     // //  likes
//     // },


//     isPublished: {  // Added missing field
//         type: Boolean,
//         default: false
//     }
// }, { timestamps: true });

// ordereSchema.plugin(mongooseAggregatePaginate);

// // Text index for search functionality
// ordereSchema.index({
//     storeName: "text",
//     category: "text",
//     productName: "text"
// });

// // Regular indexes for common queries
// ordereSchema.index({ category: 1 });
// ordereSchema.index({ storeType: 1 });
// ordereSchema.index({ isPublished: 1 });
// ordereSchema.index({ owner: 1 });

// export default mongoose.model("Order", ordereSchema);  // Changed to ordere