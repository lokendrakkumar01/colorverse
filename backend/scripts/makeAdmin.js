const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

const makeAdmin = async () => {
  const username = process.argv[2];
  if (!username) {
    console.error("Please specify username: node scripts/makeAdmin.js <username>");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const user = await User.findOneAndUpdate(
      { username },
      { role: "admin" },
      { new: true }
    );

    if (!user) {
      console.error(`User ${username} not found`);
    } else {
      console.log(`Success! User ${username} is now an ADMIN!`);
    }
  } catch (error) {
    console.error("Error making admin:", error);
  } finally {
    mongoose.disconnect();
  }
};

makeAdmin();
