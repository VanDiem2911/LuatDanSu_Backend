import { spawn } from "node:child_process";

const port = process.env.PORT || "3001";
const nextBin = "node_modules/next/dist/bin/next";

const child = spawn(
  process.execPath,
  [nextBin, "start", "-H", "0.0.0.0", "-p", port],
  {
    env: process.env,
    stdio: "inherit"
  }
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
