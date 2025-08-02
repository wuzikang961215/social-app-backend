const mongoose = require("mongoose");

// Define the Event schema with its fields and validations
const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  startTime: { type: String, required: true }, // Store as local time string YYYY-MM-DDTHH:mm
  durationMinutes: { type: Number, required: true }, // eg: 90 表示1.5小时
  location: { type: String, required: true },
  maxParticipants: { type: Number, required: true },
  description: { type: String, default: "" }, 
  category: { 
    type: String, 
    required: true, 
    enum: ["运动与户外", "音乐与影视", "美食与社交", "旅行与摄影", "学习与职业", "其他"] 
  },
  tags: [{ type: String }],
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Array of User references (ObjectIds) for participants
  // This creates a relationship between Event and User models
  // 单一数组管理所有参与用户及状态
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { 
      type: String, 
      enum: ["pending", "approved", "denied", "checkedIn", "noShow", "cancelled", "requestingCancellation"], 
      default: "pending" 
    },
    cancelCount: { type: Number, default: 0 } 
  }],

  expired: { type: Boolean, default: false }  // 过期标志
}, { 
  // Automatically add createdAt and updatedAt timestamps
  timestamps: true 
});

// Add indexes for better query performance
EventSchema.index({ expired: 1, startTime: -1 });
EventSchema.index({ category: 1 });
EventSchema.index({ creator: 1 });
EventSchema.index({ 'participants.user': 1 });

// Configure how the document is transformed when converted to JSON
EventSchema.set("toJSON", {
    transform: (doc, ret) => {
      // Replace _id with id for better API compatibility
      ret.id = ret._id;  
      // Remove MongoDB-specific fields
      delete ret._id;     
      delete ret.__v;     
    }
  });

// Export the Event model
module.exports = mongoose.model("Event", EventSchema);
