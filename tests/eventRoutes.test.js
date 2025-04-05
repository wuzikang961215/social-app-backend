const request = require("supertest");
const app = require("../server"); // 确保引入 Express 服务器
const mongoose = require("mongoose");
const Event = require("../models/Event");
const User = require("../models/User");

// 📌 清空数据库
beforeAll(async () => {
  await Event.deleteMany();
});

describe("POST /api/events", () => {
  it("应该成功创建活动（需要带 `category`）", async () => {
    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${userToken}`) // 需要登录
      .send({
        title: "篮球比赛",
        date: "2024-03-01T18:00:00",
        location: "体育馆",
        maxParticipants: 5,
        category: "运动与户外"  // 现在 category 必填
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.category).toBe("运动");
  });

  it("如果不填 `category`，应该返回错误", async () => {
    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        title: "狼人杀",
        date: "2024-03-02T20:00:00",
        location: "游戏吧",
        maxParticipants: 6
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("活动类别不能为空");
  });
});
