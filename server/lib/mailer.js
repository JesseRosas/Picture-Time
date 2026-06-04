const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // App Password, not your Gmail password
  },
});

async function sendInviteEmail({ toEmail, inviteLink }) {
  await transporter.sendMail({
    from: `"Private Gallery" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "You've been invited to a private gallery",
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1c1917;">
        <h2 style="font-weight: 400; font-size: 28px; margin-bottom: 8px;">You're invited</h2>
        <p style="color: #57534e; line-height: 1.6;">
          You've been given access to a private photo gallery.
          Click the link below to create your account and view the photos.
        </p>
        <a href="${inviteLink}"
           style="display:inline-block; margin: 24px 0; padding: 12px 28px;
                  background:#c49a3c; color:#fff; text-decoration:none;
                  font-family: sans-serif; font-size: 14px; letter-spacing: 0.05em;">
          Accept Invitation
        </a>
        <p style="color: #a8a29e; font-size: 12px;">
          This link can only be used once. If you weren't expecting this, ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 24px 0;" />
        <p style="color: #d4a853; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;">
          Private Gallery
        </p>
      </div>
    `,
  });
}

module.exports = { sendInviteEmail };
