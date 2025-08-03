const mongoose = require('mongoose');
const Event = require('../models/Event');
const User = require('../models/User');
require('dotenv').config();

async function createTestEvents() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a user to be the creator (you can change this email)
    const creator = await User.findOne();
    if (!creator) {
      console.log('No users found. Please create a user first.');
      return;
    }

    console.log(`Creating events for user: ${creator.username}`);

    // Test events data
    const testEvents = [
      {
        title: "周末爬山看日出",
        description: "一起去爬山看日出吧！预计凌晨4点出发，带上水和早餐。适合体力不错的朋友，全程约3小时。",
        location: "Bondi to Coogee Coastal Walk起点",
        startTime: new Date('2025-02-08T04:00:00'),
        durationMinutes: 240,
        category: "运动与户外",
        tags: ["社恐友好", "需要体力", "自然风光"],
        maxParticipants: 8,
        creator: creator._id
      },
      {
        title: "密室逃脱 - 侦探主题",
        description: "最新的侦探主题密室！难度中等，需要团队合作。游戏后可以一起吃饭聊天。",
        location: "Mission Escape Games, 377 Pitt St, Sydney NSW 2000",
        startTime: new Date('2025-02-09T14:00:00'),
        durationMinutes: 150,
        category: "其他",
        tags: ["烧脑", "需要配合", "新手推荐"],
        maxParticipants: 6,
        creator: creator._id
      },
      {
        title: "周日 Brunch + 逛市集",
        description: "悠闲的周日，先一起吃个brunch，然后逛逛Paddington市集。可以淘淘宝贝，拍拍照片。",
        location: "Bills Darlinghurst, 433 Liverpool St",
        startTime: new Date('2025-02-10T10:30:00'),
        durationMinutes: 180,
        category: "美食与社交",
        tags: ["轻松向", "喜欢摄影", "自由随性"],
        maxParticipants: 5,
        creator: creator._id
      },
      {
        title: "羽毛球运动局",
        description: "定期羽毛球活动！有场地，球拍可借。适合各种水平，主要是运动社交。",
        location: "Sydney Badminton Academy, 2/8 Herbert St, St Leonards",
        startTime: new Date('2025-02-07T19:00:00'),
        durationMinutes: 120,
        category: "运动与户外",
        tags: ["运动社交", "欢迎新人", "定期活动"],
        maxParticipants: 8,
        creator: creator._id
      },
      {
        title: "Board Game Night 桌游夜",
        description: "各种桌游：狼人杀、Catan、Ticket to Ride等。新手友好，会耐心教学。自带零食饮料。",
        location: "Good Games Chatswood, 1 Anderson St, Chatswood",
        startTime: new Date('2025-02-08T18:30:00'),
        durationMinutes: 210,
        category: "其他",
        tags: ["欢乐游戏", "社恐友好", "烧脑", "室内活动"],
        maxParticipants: 10,
        creator: creator._id
      },
      {
        title: "海边BBQ烧烤派对",
        description: "海边BBQ！我会准备烤架和基本食材，大家可以带想吃的东西。看夕阳，聊天，很chill~",
        location: "Coogee Beach, Goldstein Reserve BBQ area",
        startTime: new Date('2025-02-09T16:00:00'),
        durationMinutes: 240,
        category: "美食与社交",
        tags: ["轻松向", "可带朋友", "自由随性", "户外活动"],
        maxParticipants: 15,
        creator: creator._id
      },
      {
        title: "摄影walk - 探索悉尼小巷",
        description: "带上相机，一起探索悉尼的小巷和街头艺术。适合喜欢摄影的朋友，会互相分享拍摄技巧。",
        location: "QVB前集合，Queen Victoria Building",
        startTime: new Date('2025-02-10T09:00:00'),
        durationMinutes: 180,
        category: "旅行与摄影",
        tags: ["喜欢摄影", "文艺气息", "深度交流", "适合独行"],
        maxParticipants: 6,
        creator: creator._id
      }
    ];

    // Create events
    for (const eventData of testEvents) {
      const event = await Event.create(eventData);
      console.log(`Created event: "${event.title}"`);
    }

    console.log(`\nSuccessfully created ${testEvents.length} test events!`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestEvents();