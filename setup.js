const fs = require("fs");
const path = require("path");

// This file previously created product image directories automatically
// We've disabled this functionality as the directories already exist

// Define directories that would be created if needed
// Now commented out to prevent recreation on every server start
/*
const directories = [
  "public/Ordinary/Products/Skincare",
  "public/Ordinary/Products/Hair & Body",
  "public/Ordinary/Products/Sets & Collections",
];

// Create directories
directories.forEach((dir) => {
  const dirPath = path.join(__dirname, "..", dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
});
*/

// If you need to recreate these directories, uncomment the code above

// No directories created
// console.log("Directory setup skipped - using existing directories");
