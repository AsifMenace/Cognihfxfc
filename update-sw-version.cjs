const fs = require("fs");
const path = require("path");

const swPath = path.resolve(__dirname, "public", "service-worker.js");

try {
  let content = fs.readFileSync(swPath, "utf-8");
  const newVersion = `v1.${Date.now()}`;
  content = content.replace(
    /const SW_VERSION = ".*?";/,
    `const SW_VERSION = "${newVersion}";`
  );

  fs.writeFileSync(swPath, content);
  console.log(`Service worker version updated to ${newVersion}`);
} catch (err) {
  console.error("Failed to update service worker version:", err);
  process.exit(1);
}
