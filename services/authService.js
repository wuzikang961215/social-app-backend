const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

class AuthService {
  async register(userData) {
    const { username, email, password, personality, mbti, interests, tags, whyJoin, idealBuddy, expectEvent } = userData;
  
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) throw new Error("用户名或邮箱已被使用");
  
    const newUser = new User({
      username,
      email,
      password, // 👈 原始密码，schema 会自动 hash
      personality,
      mbti,
      interests: interests || [],
      tags: tags || [],
      whyJoin,
      idealBuddy,
      expectEvent,
    });
  
    await newUser.save();
    return newUser;
  }
  

  async login(email, password) {
    const user = await User.findOne({ email });
    if (!user) throw new Error("邮箱或密码错误"); // Don't reveal which one is wrong

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("邮箱或密码错误"); // Same message for security

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    
    // Return clean user object
    const userObj = user.toObject();
    delete userObj.password;
    userObj.id = userObj._id;
    
    return { token, user: userObj };
  }
}

module.exports = new AuthService();
