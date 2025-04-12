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

  
// POST /api/events/:id/review
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

    // ✅ 只允许审核 pending 或 denied 的用户
    if (!["pending", "denied"].includes(participant.status)) {
      return res.status(400).json({ message: "只能审核待审核或被拒绝的用户" });
    }

    participant.status = approve ? "approved" : "denied";
    await event.save();

    const populated = await Event.findById(event.id)
      .populate("participants.user", "username level score isVIP")
      .lean();

    // 清洗 _id（如你想保持统一结构）
    populated.participants = populated.participants.map(p => ({
      user: p.user,
      status: p.status,
      cancelCount: p.cancelCount,
    }));

    res.json({ message: "审核完成", event });
  } catch (error) {
    next(error);
  }
});

// POST /api/events/:id/checkin
router.post("/:id/checkin", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "活动未找到" });

    if (event.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: "只有活动创建者可以签到" });
    }

    const participant = event.participants.find((p) => p.user.toString() === userId);
    if (!participant) return res.status(404).json({ message: "未找到该报名用户" });

    if (!["approved", "noShow"].includes(participant.status)) {
      return res.status(400).json({ message: "仅已通过或者标记失误的用户可签到" });
    }

    participant.status = "checkedIn";
    await event.save();

    const populated = await Event.findById(event.id)
      .populate("participants.user", "username level score isVIP")
      .lean();

    // 清洗每项 _id
    populated.participants = populated.participants.map(p => ({
      user: p.user,
      status: p.status,
      cancelCount: p.cancelCount,
    }));

    res.json({ message: "签到成功", event });
  } catch (error) {
    next(error);
  }
});

// POST /api/events/:id/noshow
router.post("/:id/noshow", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "活动未找到" });

    if (event.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: "只有活动创建者可以标记放鸽子" });
    }

    const participant = event.participants.find((p) => p.user.toString() === userId);
    if (!participant) return res.status(404).json({ message: "未找到该报名用户" });

    if (!["approved", "checkedIn"].includes(participant.status)) {
      return res.status(400).json({ message: "只有已通过审核或标记失误的用户可以被标记为 no-show" });
    }

    participant.status = "noShow";
    await event.save();
    res.json({ message: "已标记为 no-show", event });
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



module.exports = router;
