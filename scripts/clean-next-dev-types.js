const fs = require("fs");
const path = require("path");

const staleTypesDir = path.join(process.cwd(), ".next", "dev", "types");

try {
  fs.rmSync(staleTypesDir, { recursive: true, force: true });
} catch {
  // The folder is generated only by local dev builds; ignore if absent.
}
