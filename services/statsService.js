const User = require("../models/User");

class StatsService {
  async getTopInterests() {
    const users = await User.find({}, "interests");

    const countMap = new Map();

    for (const user of users) {
      if (Array.isArray(user.interests)) {
        for (const interest of user.interests) {
          countMap.set(interest, (countMap.get(interest) || 0) + 1);
        }
      }
    }

    const sorted = Array.from(countMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([interest, count]) => ({ interest, count }));

    return sorted;
  }
}

module.exports = new StatsService();
