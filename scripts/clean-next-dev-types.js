const fs = require("fs");
const path = require("path");

const staleDirs = [
  path.join(process.cwd(), ".next", "dev"),
  path.join(process.cwd(), ".next", "dev", "types"),
];

for (const dir of staleDirs) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // Generated only by local dev; ignore if absent.
  }
}
