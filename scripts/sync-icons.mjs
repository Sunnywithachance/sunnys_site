import { cp, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const sourceDir = path.join(rootDir, "icons");
const targetDir = path.join(rootDir, "public", "icons");

const shouldSkip = (name) => name.startsWith(".");

const syncIcons = async () => {
  await mkdir(targetDir, { recursive: true });
  const entries = await readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || shouldSkip(entry.name)) continue;

    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    await cp(sourcePath, targetPath, { force: true });
  }

  const appleSource = path.join(sourceDir, "apple-touch-icon.png");
  await cp(appleSource, path.join(targetDir, "apple-touch-icon-150.png"), { force: true });
  await cp(appleSource, path.join(targetDir, "apple-touch-icon-180.png"), { force: true });
};

syncIcons().catch((error) => {
  console.error("Icon sync failed:", error);
  process.exit(1);
});
