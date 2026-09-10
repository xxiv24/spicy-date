const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  reportedUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  reason: { type: String, enum: ["spam", "harassment", "fake_profile", "inappropriate_content", "scam", "other"], required: true },
  description: { type: String, maxlength: 500, trim: true },
  status: { type: String, enum: ["pending", "reviewed", "resolved", "dismissed"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

reportSchema.index({ reporterId: 1, reportedUserId: 1 });
module.exports = mongoose.model("Report", reportSchema);
