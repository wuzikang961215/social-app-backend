const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  // Legacy field - not used in new registrations but kept for existing users
  personality: { 
    type: String,
    select: false // Won't be included in queries by default
  },
  mbti: { 
    type: String, 
    enum: ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 
           'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'],
    default: null 
  },
  interests: [String],
  tags: [String],

  whyJoin: String,
  idealBuddy: String,

  role: { type: String, enum: ["user", "admin"], default: "user" },
}, { timestamps: true });

// 📌 Encrypt password before saving user
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.password; // Do not return password
  }
});

module.exports = mongoose.model("User", UserSchema);
