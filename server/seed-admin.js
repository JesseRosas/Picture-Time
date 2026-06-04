/**
 * Run this once to create your admin account:
 * node seed-admin.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const readline = require("readline");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected\n");

  // Inline schema so we don't need to import anything complex
  const bcrypt = require("bcryptjs");
  const User = require("./models/User");

  const name = await ask("Admin name: ");
  const email = await ask("Admin email: ");
  const password = await ask("Admin password (min 8 chars): ");

  if (password.length < 8) {
    console.error("Password too short.");
    process.exit(1);
  }

  const existing = await User.findOne({ email });
  if (existing) {
    // Just make them admin if they already exist
    existing.isAdmin = true;
    await existing.save();
    console.log(`\n✓ Existing user ${email} is now an admin.`);
  } else {
    await User.create({ name, email, password, isAdmin: true });
    console.log(`\n✓ Admin account created for ${email}`);
  }

  console.log("You can now log in at http://localhost:5173/login");
  rl.close();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
