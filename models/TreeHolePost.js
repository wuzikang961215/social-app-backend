const mongoose = require("mongoose");

const TreeHolePostSchema = new mongoose.Schema({
  content: { 
    type: String, 
    required: true,
    maxLength: 300,
    trim: true
  },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true
    // We store author ID for functionality but never expose it
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  likeCount: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true 
});

// Index for efficient queries
TreeHolePostSchema.index({ createdAt: -1 });

// Update like count when likes array changes
TreeHolePostSchema.pre('save', function(next) {
  this.likeCount = this.likes.length;
  next();
});

// Custom toJSON to ensure anonymity
TreeHolePostSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.author; // Never expose author
    delete ret.likes; // Don't expose who liked
    return ret;
  }
});

module.exports = mongoose.model("TreeHolePost", TreeHolePostSchema);