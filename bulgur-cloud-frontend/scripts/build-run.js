/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const frontendRoot = path.join(__dirname, "..");
const projectRoot = path.join(frontendRoot, "..");

console.log("Getting dev build of the frontend");
execSync("yarn build:web --dev", { cwd: frontendRoot, stdio: "inherit" });

console.log("Cleaning up test user files");
fs.rmSync(path.join(projectRoot, "storage", "testuser"), {
  force: true,
  recursive: true,
});

console.log("Creating test user");
execSync(
  "cargo llvm-cov --all-features --workspace --lcov --output-path cli.info -- run user add --username testuser --password testpass",
  {
    cwd: projectRoot,
    stdio: "inherit",
  },
);
console.log("Starting the backend server");
execSync(
  "cargo llvm-cov --all-features --workspace --lcov --output-path e2e.info run",
  { cwd: projectRoot, stdio: "inherit" },
);
