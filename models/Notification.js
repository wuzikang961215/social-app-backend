const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true 
  },
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  type: { 
    type: String, 
    enum: ["event_approved", "event_denied", "event_join_request", "event_cancelled", "event_checkin", "event_update"],
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  eventId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Event" 
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  metadata: {
    eventTitle: String,
    eventTime: String,
    eventLocation: String,
    userName: String
  }
}, { 
  timestamps: true 
});

// Index for efficient queries
NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

// Auto-delete old read notifications after 30 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000, partialFilterExpression: { read: true } });

NotificationSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model("Notification", NotificationSchema);