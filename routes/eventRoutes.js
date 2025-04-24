const express = require("express");
const Event = require("../models/Event");
const User = require("../models/User");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const rateLimiter = require("../middleware/rateLimiter");

// 📌 Get all events
router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {}; // Filter by category if provided
    const events = await Event.find(filter).populate("participants.user", "username email")
    .populate("creator", "username email");
    res.json(events);
  } catch (error) {
    next(error);  // Pass error to middleware
  }
});

// 📌 只返回自己创建的、包含 pending / approved 用户的活动
router.get("/manage", authMiddleware, async (req, res, next) => {
  try {
    const events = await Event.find({ creator: req.user.id })
      .populate("participants.user", "username isVIP score idealBuddy whyJoin interests")
      .populate("creator", "username email");

    // ✅ 过滤参与者，同时只返回至少包含一位的活动
    const filteredEvents = events
      .map(event => {
        const relevantParticipants = event.participants.filter(p =>
          ["pending", "approved"].includes(p.status)
        );

        if (relevantParticipants.length === 0) return null;

        return {
          ...event.toJSON(),
          participants: relevantParticipants,
        };
      })
      .filter(Boolean); // 移除 null 项（即无 relevantParticipants 的活动）

    res.json(filteredEvents);
  } catch (error) {
    next(error);
  }
});

  
// 📌 获取我创建的所有活动（不限制参与者状态）
router.get("/my-created", authMiddleware, async (req, res, next) => {
  try {
    const events = await Event.find({ creator: req.user.id })
      .populate("participants.user", "username isVIP score idealBuddy whyJoin interests")
      .populate("creator", "username email");

    res.json(events);
  } catch (error) {
    next(error);
  }
});

// 📌 获取我参与的活动（排除被拒绝 / 已取消）
router.get("/my-participated", authMiddleware, async (req, res, next) => {
  try {
    const events = await Event.find({
      "participants.user": req.user.id,
    })
      .populate("participants.user", "username isVIP score idealBuddy whyJoin interests")
      .populate("creator", "username email");

    const filtered = events
      .map((event) => {
        const me = event.participants.find(
          (p) =>
            p.user.id === req.user.id &&
            !["denied", "cancelled"].includes(p.status)
        );
        return me ? event.toJSON() : null;
      })
      .filter(Boolean);

    res.json(filtered);
  } catch (error) {
    next(error);
  }
});



// 📌 Get a single event by ID
router.get("/:id", authMiddleware, async (req, res, next) => {
    try {
      const event = await Event.findById(req.params.id).populate("participants.user", "username email")
      .populate("creator", "username email");
      if (!event) {
        return res.status(404).json({ message: "活动未找到" });
      }
      res.json(event);
    } catch (error) {
      next(error);
    }
  });
  
  

router.post("/", authMiddleware, rateLimiter, async (req, res, next) => {
    try {
      const {
        title,
        startTime,
        durationMinutes,
        location,
        maxParticipants,
        category,
        tags = [],
        description = ""
      } = req.body;

      const newEvent = new Event({
        title,
        startTime,
        durationMinutes,
        location,
        maxParticipants,
        category,
        tags,
        description,
        creator: req.user.id  // ✅ 自动绑定当前登录用户为创建者
      });

      await newEvent.save();

      res.status(201).json(newEvent);
    } catch (error) {
      next(error);
    }
});
  

// 📌 Update event information
router.patch("/:id", authMiddleware, rateLimiter, async (req, res, next) => {
  try {
    // ✅ 管理员权限判断
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "仅管理员可修改活动信息" });
    }

    const updateData = req.body;

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ message: "活动未找到" });
    }

    res.json(updatedEvent);
  } catch (error) {
    next(error);
  }
});


// 📌 Delete event
router.delete("/:id", authMiddleware, async (req, res, next) => {
  try {
    // ✅ 管理员权限判断
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "仅管理员可删除活动" });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      const err = new Error("Event not found");
      err.statusCode = 404;
      throw err;
    }

    await event.deleteOne();
    res.json({ message: "Event deleted" });
  } catch (error) {
    next(error);  // Pass error to middleware
  }
});


// 📌 Join event route with populate
router.post("/:id/join", authMiddleware, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "活动未找到" });

    const userId = req.user.id;

    // ✅ 阻止发起人报名自己的活动
    if (event.creator.toString() === userId) {
      return res.status(403).json({ message: "你是该活动的发起人，无法报名自己的活动" });
    }

    // 查找是否已经参与
    const existing = event.participants.find(p => p.user.toString() === userId);

    if (existing) {
      if (existing.status === "cancelled") {
        if (existing.cancelCount >= 2) {
          return res.status(400).json({ message: "你已取消报名超过2次，不能再次加入" });
        }

        // 允许重新加入
        existing.status = "pending";
        await event.save();

        const populated = await Event.findById(event.id).populate("participants.user");
        return res.json({ message: "已重新加入活动，等待审核", event: populated });
      }

      // 已报名且状态不允许重复
      return res.status(400).json({ message: "你已经报名过此活动" });
    }

    // 首次报名
    event.participants.push({
      user: userId,
      status: "pending",
      cancelCount: 0
    });

    await event.save();

    // 🔥 重点：报名完成后用 populate 获取完整参与者信息
    const populated = await Event.findById(event.id).populate("participants.user");

    return res.json({ message: "已成功报名，等待发起人审核", event: populated });

  } catch (err) {
    next(err);
  }
});


  
// 📌 Leave event
router.post("/:id/leave", authMiddleware, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "活动未找到" });

    const userId = req.user.id;

    const participant = event.participants.find(
      (p) => p.user.toString() === userId
    );

    if (!participant) {
      return res.status(400).json({ message: "你未报名该活动" });
    }

    if (participant.status !== "pending") {
      return res.status(400).json({ message: "你已被审核，无法取消报名" });
    }

    // ✅ 将状态改为 cancelled，并增加 cancelCount（容错老数据）
    participant.status = "cancelled";
    participant.cancelCount = (participant.cancelCount) + 1;

    await event.save();
    res.json({ message: "已取消报名", event });
  } catch (error) {
    next(error);
  }
});

  
// POST /api/events/:id/review ✅ 只允许审核 pending 用户
router.post("/:id/review", authMiddleware, async (req, res, next) => {
  try {
    const { userId, approve } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "活动未找到" });

    if (event.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: "只有活动创建者可以审核" });
    }

    const participant = event.participants.find((p) => p.user.toString() === userId);
    if (!participant) return res.status(404).json({ message: "未找到该报名用户" });

    if (participant.status !== "pending") {
      return res.status(400).json({ message: "只能审核待审核用户" });
    }

    participant.status = approve ? "approved" : "denied";
    await event.save();

    const populated = await Event.findById(event.id)
      .populate("participants.user", "username level score isVIP")
      .lean();

    populated.participants = populated.participants.map(p => ({
      user: p.user,
      status: p.status,
      cancelCount: p.cancelCount,
    }));

    res.json({ message: "审核完成", event: populated });
  } catch (error) {
    next(error);
  }
});


// ✅ 合并签到与放鸽子为 /attendance
// POST /api/events/:id/attendance
router.post("/:id/attendance", authMiddleware, async (req, res, next) => {
  try {
    const { userId, attended } = req.body;  // attended: true 或 false
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "活动未找到" });

    if (event.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: "只有活动创建者可以操作出勤" });
    }

    const participant = event.participants.find((p) => p.user.toString() === userId);
    if (!participant) return res.status(404).json({ message: "未找到该报名用户" });

    if (participant.status !== "approved") {
      return res.status(400).json({ message: "只能操作已通过的用户" });
    }

    participant.status = attended ? "checkedIn" : "noShow";
    await event.save();

    const populated = await Event.findById(event.id)
      .populate("participants.user", "username level score isVIP")
      .lean();

    populated.participants = populated.participants.map(p => ({
      user: p.user,
      status: p.status,
      cancelCount: p.cancelCount,
    }));

    res.json({ message: attended ? "签到成功" : "已标记为 no-show", event: populated });
  } catch (error) {
    next(error);
  }
});


// POST /api/events/:id/request-cancel
router.post("/:id/request-cancel", authMiddleware, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "活动未找到" });

    const participant = event.participants.find(
      (p) => p.user.toString() === req.user.id
    );
    if (!participant) return res.status(400).json({ message: "你未报名该活动" });

    if (participant.status !== "approved") {
      return res.status(400).json({ message: "只有已通过的用户才能申请取消" });
    }

    participant.status = "requestingCancellation";
    await event.save();
    res.json({ message: "已申请取消，请等待审核", event });
  } catch (err) {
    next(err);
  }
});

// POST /api/events/:id/review-cancel
router.post("/:id/review-cancel", authMiddleware, async (req, res, next) => {
  try {
    const { userId, approve } = req.body;  // ✅ approve: true 表示同意，false 表示拒绝
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "活动未找到" });

    if (event.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: "只有活动创建者可以审核取消申请" });
    }

    const participant = event.participants.find((p) => p.user.toString() === userId);
    if (!participant) return res.status(404).json({ message: "未找到该用户" });

    if (participant.status !== "requestingCancellation") {
      return res.status(400).json({ message: "该用户未申请取消" });
    }

    if (approve) {
      participant.status = "cancelled";
      participant.cancelCount = (participant.cancelCount ?? 0) + 1;
    } else {
      participant.status = "approved";  // 拒绝取消请求，回退为 approved
    }

    await event.save();
    res.json({ message: approve ? "取消申请已通过" : "取消申请已被拒绝", event });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/events/:id/participant/:userId
router.delete("/:id/participant/:userId", authMiddleware, async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const event = await Event.findById(id);

    if (!event) return res.status(404).json({ message: "活动未找到" });

    // 权限验证
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "你没有权限移除该用户" });
    }

    const beforeLength = event.participants.length;

    // 只保留非目标用户
    event.participants = event.participants.filter(
      (p) => p.user.toString() !== userId
    );

    if (event.participants.length === beforeLength) {
      return res.status(404).json({ message: "该用户未报名此活动" });
    }

    await event.save();
    res.json({ message: "已成功移除该用户", event });
  } catch (error) {
    next(error);
  }
});




module.exports = router;
