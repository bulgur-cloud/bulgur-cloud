/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const { execSync } = require("child_process");

const frontendRoot = path.join(__dirname, "..");
const projectRoot = path.join(frontendRoot, "..");

console.log("Getting dev build of the frontend");
execSync("yarn build:web --dev", { cwd: frontendRoot, stdio: "inherit" });

console.log("Creating test user");
execSync("cargo run user add --username testuser --password testpass", {
  cwd: projectRoot,
  stdio: "inherit",
});
console.log("Starting the backend server");
execSync("cargo run", { cwd: projectRoot, stdio: "inherit" });
