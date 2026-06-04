const router = require("express").Router();
const { upload, cloudinary } = require("../lib/cloudinary");
const Photo = require("../models/Photo");
const Comment = require("../models/Comment");
const { requireAuth, requireAdmin } = require("../middleware/auth");

// GET /api/photos — all authenticated users can view
router.get("/", requireAuth, async (req, res) => {
  try {
    const photos = await Photo.find()
      .sort({ order: 1, createdAt: -1 })
      .populate("uploadedBy", "name");

    // Attach comment counts
    const withCounts = await Promise.all(
      photos.map(async (photo) => {
        const commentCount = await Comment.countDocuments({ photo: photo._id });
        return { ...photo.toObject(), commentCount };
      })
    );

    res.json(withCounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/photos — admin only, supports multiple files
router.post(
  "/",
  requireAuth,
  requireAdmin,
  upload.array("photos", 20),
  async (req, res) => {
    try {
      if (!req.files?.length) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const caption = req.body.caption || "";

      const last = await Photo.findOne().sort({ order: -1 });
      const startOrder = last ? last.order + 1 : 0;

      const saved = await Promise.all(
        req.files.map((file, i) =>
          Photo.create({
            cloudinaryId: file.filename,
            url: file.path,
            caption,
            uploadedBy: req.user._id,
            order: startOrder + i,
          })
        )
      );

      res.status(201).json(saved);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// PUT /api/photos/reorder — admin only
router.put("/reorder", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: "orderedIds must be an array" });
    }
    await Promise.all(
      orderedIds.map((id, index) => Photo.findByIdAndUpdate(id, { order: index }))
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/photos/:id/like — toggle like for current user
router.post("/:id/like", requireAuth, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).json({ error: "Photo not found" });

    const userId = req.user._id.toString();
    const alreadyLiked = photo.likes.map(l => l.toString()).includes(userId);

    if (alreadyLiked) {
      photo.likes = photo.likes.filter(l => l.toString() !== userId);
    } else {
      photo.likes.push(req.user._id);
    }

    await photo.save();
    res.json({ likes: photo.likes.length, liked: !alreadyLiked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/photos/:id/comments
router.get("/:id/comments", requireAuth, async (req, res) => {
  try {
    const comments = await Comment.find({ photo: req.params.id })
      .populate("user", "name")
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/photos/:id/comments
router.post("/:id/comments", requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: "Comment text required" });

    const comment = await Comment.create({
      photo: req.params.id,
      user: req.user._id,
      text: text.trim(),
    });

    await comment.populate("user", "name");
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/photos/:id/comments/:commentId — comment owner or admin
router.delete("/:id/comments/:commentId", requireAuth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    const isOwner = comment.user.toString() === req.user._id.toString();
    if (!isOwner && !req.user.isAdmin) {
      return res.status(403).json({ error: "Not allowed" });
    }

    await comment.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/photos/:id — admin only
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).json({ error: "Photo not found" });

    await cloudinary.uploader.destroy(photo.cloudinaryId);
    await Comment.deleteMany({ photo: photo._id });
    await photo.deleteOne();

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

