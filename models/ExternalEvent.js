const mongoose = require("mongoose");
const translationService = require("../services/translationService");

const ExternalEventSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  titleTranslated: {
    type: String // Stores the Chinese translation
  },
  description: {
    type: String,
    required: true
  },
  descriptionTranslated: {
    type: String // Stores the Chinese translation
  },
  time: { 
    type: Date, 
    required: true
  },
  location: { 
    type: String, 
    required: true 
  },
  link: { 
    type: String, 
    required: true
  },
  
  // Formatted time string
  timeFormatted: { 
    type: String
  },
  
  // Created by admin
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { 
  timestamps: true 
});

// Index for efficient queries
ExternalEventSchema.index({ time: 1 });

// Format dates in Chinese
ExternalEventSchema.methods.formatChineseTime = function() {
  const date = new Date(this.time);
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = days[date.getDay()];
  const hour = date.getHours();
  const minute = date.getMinutes();
  
  let timeStr = '';
  if (hour < 6) timeStr = '凌晨';
  else if (hour < 12) timeStr = '上午';
  else if (hour < 18) timeStr = '下午';
  else timeStr = '晚上';
  
  const hourFormatted = hour % 12 || 12;
  const minuteFormatted = minute.toString().padStart(2, '0');
  
  return `${month}月${day}日 ${weekday} ${timeStr}${hourFormatted}:${minuteFormatted}`;
};

// Auto-format time and translate title before saving
ExternalEventSchema.pre('save', async function(next) {
  try {
    // Format time
    this.timeFormatted = this.formatChineseTime();
    
    // Translate title if it's new or changed
    if (this.isModified('title')) {
      // Check if title contains Chinese characters
      const isChinese = /[\u4e00-\u9fa5]/.test(this.title);
      
      if (isChinese) {
        // If title is already in Chinese, use it as translated version
        this.titleTranslated = this.title;
      } else {
        // Translate English to Chinese
        this.titleTranslated = await translationService.translateText(this.title);
      }
    }
    
    // Translate description if it's new or changed
    if (this.isModified('description')) {
      const isChinese = /[\u4e00-\u9fa5]/.test(this.description);
      
      if (isChinese) {
        this.descriptionTranslated = this.description;
      } else {
        this.descriptionTranslated = await translationService.translateText(this.description);
      }
    }
    
    next();
  } catch (error) {
    console.error('Pre-save error:', error);
    next(error);
  }
});

ExternalEventSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model("ExternalEvent", ExternalEventSchema);