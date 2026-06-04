const router = require("express").Router();
const crypto = require("crypto");
const Invite = require("../models/Invite");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { sendInviteEmail } = require("../lib/mailer");

// POST /api/invites — admin creates and emails an invite
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const token = crypto.randomBytes(32).toString("hex");

    await Invite.create({ email, token, createdBy: req.user._id });

    const inviteLink = `${process.env.CLIENT_URL}/register?token=${token}`;

    // Send the invite email automatically
    await sendInviteEmail({ toEmail: email, inviteLink });

    res.status(201).json({ ok: true, inviteLink });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/invites — admin sees all invites
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const invites = await Invite.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "name");
    res.json(invites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/invites/verify?token=xxx — anyone can check if a token is valid
// Used by the register page before showing the form
router.get("/verify", async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: "Token required" });

  const invite = await Invite.findOne({ token, usedAt: null });
  if (!invite) return res.status(410).json({ error: "Invalid or used token" });

  res.json({ valid: true, email: invite.email });
});

// DELETE /api/invites/:id — admin cancels a pending invite
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const invite = await Invite.findById(req.params.id);
    if (!invite) return res.status(404).json({ error: "Invite not found" });
    if (invite.usedAt) return res.status(400).json({ error: "Cannot cancel an already accepted invite" });
    await invite.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
