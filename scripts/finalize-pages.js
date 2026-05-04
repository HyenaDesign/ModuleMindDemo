const fs = require("fs");
const path = require("path");

const docsDir = path.join(__dirname, "..", "docs");
const indexPath = path.join(docsDir, "index.html");

fs.writeFileSync(path.join(docsDir, ".nojekyll"), "");

if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, path.join(docsDir, "404.html"));
}
