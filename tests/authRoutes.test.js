const request = require("supertest");
const app = require("../server"); // 确保引入 Express 服务器
const mongoose = require("mongoose");
const Event = require("../models/Event");
const User = require("../models/User");

beforeAll(async () => {
  await User.deleteMany(); // 清空用户数据
});

afterAll(async () => {
  await mongoose.connection.close();
});

// 📌 测试注册用户（必须带 `interests`）
describe("POST /api/auth/register", () => {
  it("应该成功注册用户", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        username: "testuser",
        email: "test@example.com",
        password: "123456",
        interests: ["音乐与影视", "旅行与摄影"]  // 现在 interests 是必填的
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.username).toBe("testuser");
    expect(res.body.interests).toContain("音乐与影视s");
  });

  it("如果不填 `interests`，应该返回错误", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        username: "user2",
        email: "user2@example.com",
        password: "123456"
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("兴趣类别无效");
  });
});
