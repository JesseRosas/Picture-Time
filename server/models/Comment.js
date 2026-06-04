const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    photo: { type: mongoose.Schema.Types.ObjectId, ref: "Photo", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);
