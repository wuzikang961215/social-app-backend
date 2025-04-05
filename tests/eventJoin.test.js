const request = require("supertest");
const app = require("../server"); // 确保引入 Express 服务器
const mongoose = require("mongoose");
const Event = require("../models/Event");
const User = require("../models/User");

describe("POST /api/events/:id/join", () => {
    it("应该允许用户报名（未满）", async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/join`)
        .set("Authorization", `Bearer ${userToken}`);
  
      expect(res.statusCode).toBe(200);
      expect(res.body.participants.length).toBe(1);
    });
  
    it("如果活动已满，应该进入候补名单", async () => {
      // 先报名满 5 人
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post(`/api/events/${eventId}/join`)
          .set("Authorization", `Bearer ${generateFakeToken()}`); // 模拟多个用户
      }
  
      // 第 6 个人报名
      const res = await request(app)
        .post(`/api/events/${eventId}/join`)
        .set("Authorization", `Bearer ${userToken}`);
  
      expect(res.statusCode).toBe(200);
      expect(res.body.waitlist.length).toBe(1); // 进入候补名单
    });
  
    it("如果已经报名，不能重复报名", async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/join`)
        .set("Authorization", `Bearer ${userToken}`);
  
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("你已经报名或在候补名单中");
    });
  });
  