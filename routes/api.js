
async function getBlockedUserIds(userId) {
  try {
    const blocks = await Interaction.find({
      $or: [
        { fromUser: userId, action: "block" },
        { toUser: userId, action: "block" }
      ]
    }).lean();
    
    const blockedSet = new Set();
    blocks.forEach(b => {
      if (b.fromUser.toString() === userId.toString()) {
        blockedSet.add(b.toUser.toString());
      } else {
        blockedSet.add(b.fromUser.toString());
      }
    });
    return Array.from(blockedSet);
  } catch (err) {
    return [];
  }
}

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const UserProfile = require("../models/UserProfile");
const Chat = require("../models/Chat");
const VIPStatus = require("../models/VIPStatus");
const Interaction = require("../models/Interaction");
const Report = require("../models/Report");

const authService = require("../services/authService");
const authMiddleware = authService.authMiddleware || authService.authenticateToken || authService;

if (typeof authMiddleware === "function") {
  router.use(authMiddleware);
}

router.get("/profile", async (req, res) => {
  try {
    const userId = req.user ? (req.user.userId || req.user._id || req.user.id) : null;
    if (!userId) return res.status(401).json({ success: false, error: "توکن نامعتبر است یا کاربر احراز هویت نشده است" });
    const profile = await UserProfile.findOne({ userId });
    if (!profile) return res.status(404).json({ success: false, error: "پروفایل یافت نشد" });
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/profile/update", async (req, res) => {
  try {
    const userId = req.user ? (req.user.userId || req.user._id || req.user.id) : null;
    if (!userId) return res.status(401).json({ success: false, error: "توکن نامعتبر است یا کاربر احراز هویت نشده است" });
    const { bio, interests, location, preferences } = req.body;
    let profile = await UserProfile.findOne({ userId });
    if (!profile) {
      profile = new UserProfile({ userId, bio, interests, location, preferences });
    } else {
      if (bio !== undefined) profile.bio = bio;
      if (interests !== undefined) profile.interests = interests;
      if (location !== undefined) profile.location = location;
      if (preferences !== undefined) profile.preferences = preferences;
    }
    await profile.save();
    res.json({ success: true, message: "پروفایل با موفقیت به‌روزرسانی شد", data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// دریافت کاربران پیشنهادی (Discovery) با اعمال فیلتر مسدودسازی دوطرفه
router.get("/discover", authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user && (req.user._id || req.user.id || req.user.userId);
    if (!currentUserId) {
      return res.status(401).json({ success: false, message: "احراز هویت نامعتبر است." });
    }

    // ۱. استخراج کاربران بلاک‌شده دوطرفه
    const blockedIds = await getBlockedUserIds(currentUserId);

    // ۲. استخراج کاربرانی که قبلاً تعامل (لایک/پاس) داشته‌اند
    const interactions = await Interaction.find({ fromUser: currentUserId }).select("toUser").lean();
    const interactedIds = interactions.map(i => i.toUser.toString());

    // لیست کامل آی‌دی‌های مستثنی‌شده
    const excludeIds = Array.from(new Set([...blockedIds, ...interactedIds, currentUserId.toString()]));

    // ۳. کوئری کاربران واجد شرایط از دیتابیس
    const candidates = await User.find({
      _id: { $nin: excludeIds }
    })
    .select("-password -__v")
    .limit(20)
    .lean();

    return res.status(200).json({
      success: true,
      count: candidates.length,
      users: candidates
    });
  } catch (error) {
    console.error("Error in /discover:", error);
    return res.status(500).json({ success: false, message: "خطای سرور در دریافت دیسکاور." });
  }
});


router.post("/chats/send", async (req, res) => {
  try {
    const userId = req.user ? (req.user.userId || req.user._id || req.user.id) : null;
    if (!userId) return res.status(401).json({ success: false, error: "توکن نامعتبر است یا کاربر احراز هویت نشده است" });
    const { receiverId, message } = req.body;
    if (!receiverId || !message) {
      return res.status(400).json({ success: false, error: "شناسه گیرنده و متن پیام الزامی است" });
    }
    const isBlocked = await Interaction.findOne({
      $or: [
        { fromUser: userId, toUser: receiverId, action: "block" },
        { fromUser: receiverId, toUser: userId, action: "block" }
      ]
    });
    if (isBlocked) {
      return res.status(403).json({ success: false, error: "امکان ارسال پیام به دلیل مسدود بودن وجود ندارد" });
    }
    const newChat = new Chat({ senderId: userId, receiverId, message, read: false });
    await newChat.save();
    res.status(201).json({ success: true, data: newChat });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/chats/:chatId", async (req, res) => {
  try {
    const userId = req.user ? (req.user.userId || req.user._id || req.user.id) : null;
    if (!userId) return res.status(401).json({ success: false, error: "توکن نامعتبر است یا کاربر احراز هویت نشده است" });
    const targetUserId = req.params.chatId;
    const messages = await Chat.find({
      $or: [
        { senderId: userId, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: userId }
      ]
    }).sort({ createdAt: 1 });
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/vip/status", async (req, res) => {
  try {
    const userId = req.user ? (req.user.userId || req.user._id || req.user.id) : null;
    if (!userId) return res.status(401).json({ success: false, error: "توکن نامعتبر است یا کاربر احراز هویت نشده است" });
    const vip = await VIPStatus.findOne({ userId });
    if (!vip || !vip.isActive || (vip.expiresAt && vip.expiresAt < new Date())) {
      return res.json({ success: true, data: { isVIP: false, plan: null, expiresAt: null, features: [] } });
    }
    res.json({
      success: true,
      data: {
        isVIP: true,
        plan: vip.plan,
        expiresAt: vip.expiresAt,
        features: vip.features,
        visibilityMultiplier: vip.visibilityMultiplier
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/vip/upgrade", async (req, res) => {
  try {
    const userId = req.user ? (req.user.userId || req.user._id || req.user.id) : null;
    if (!userId) return res.status(401).json({ success: false, error: "توکن نامعتبر است یا کاربر احراز هویت نشده است" });
    const { plan, paymentMethod } = req.body;
    if (!["monthly", "yearly", "lifetime"].includes(plan)) {
      return res.status(400).json({ success: false, error: "پلن انتخابی نامعتبر است" });
    }
    let durationDays = 30;
    let price = 9.99;
    if (plan === "yearly") { durationDays = 365; price = 89.99; }
    else if (plan === "lifetime") { durationDays = 36500; price = 199.99; }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const vip = await VIPStatus.findOneAndUpdate(
      { userId },
      {
        plan,
        paymentMethod: paymentMethod || "crypto",
        price,
        startDate: new Date(),
        expiresAt,
        isActive: true,
        features: ["unlimited_likes", "night_mask", "ad_free", "priority_match", "see_likes", "rewind"],
        visibilityMultiplier: 3,
        transactionId: "TXN_" + Date.now()
      },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: "اکانت با موفقیت به VIP ارتقا یافت", data: vip });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/users/block", async (req, res) => {
  try {
    const userId = req.user ? (req.user.userId || req.user._id || req.user.id) : null;
    if (!userId) return res.status(401).json({ success: false, error: "توکن نامعتبر است یا کاربر احراز هویت نشده است" });
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ success: false, error: "شناسه کاربر هدف الزامی است" });
    if (targetUserId.toString() === userId.toString()) return res.status(400).json({ success: false, error: "امکان مسدودسازی خود وجود ندارد" });

    const interaction = await Interaction.findOneAndUpdate(
      { fromUser: userId, toUser: targetUserId },
      { action: "block" },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: "کاربر با موفقیت مسدود شد", data: interaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/users/report", async (req, res) => {
  try {
    const userId = req.user ? (req.user.userId || req.user._id || req.user.id) : null;
    if (!userId) return res.status(401).json({ success: false, error: "توکن نامعتبر است یا کاربر احراز هویت نشده است" });
    const { reportedUserId, reason, description } = req.body;
    if (!reportedUserId || !reason) {
      return res.status(400).json({ success: false, error: "شناسه کاربر و دلیل گزارش الزامی است" });
    }
    const report = new Report({
      reporterId: userId,
      reportedUserId,
      reason,
      description: description || ""
    });
    await report.save();
    res.status(201).json({ success: true, message: "گزارش تخلف ثبت گردید", data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// --- Unblock User ---
router.post("/users/unblock", async (req, res) => {
  try {
    const userId = req.user ? (req.user.userId || req.user._id || req.user.id) : null;
    if (!userId) return res.status(401).json({ success: false, error: "توکن نامعتبر است یا کاربر احراز هویت نشده است" });
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ success: false, error: "شناسه کاربر هدف الزامی است" });

    const result = await Interaction.findOneAndDelete({
      fromUser: userId,
      toUser: targetUserId,
      action: "block"
    });

    if (!result) {
      return res.status(404).json({ success: false, message: "این کاربر در لیست مسدودشدگان شما قرار ندارد" });
    }

    res.json({ success: true, message: "کاربر با موفقیت از مسدودیت خارج شد" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- Get Blocked Users List ---
router.get("/users/blocked", async (req, res) => {
  try {
    const userId = req.user ? (req.user.userId || req.user._id || req.user.id) : null;
    if (!userId) return res.status(401).json({ success: false, error: "توکن نامعتبر است یا کاربر احراز هویت نشده است" });

    const blockedInteractions = await Interaction.find({
      fromUser: userId,
      action: "block"
    }).populate("toUser", "firstName lastName username email photos").lean();

    const blockedUsers = blockedInteractions
      .filter(i => i.toUser)
      .map(i => ({
        blockedAt: i.createdAt || i.updatedAt,
        user: i.toUser
      }));

    res.json({ success: true, count: blockedUsers.length, data: blockedUsers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
