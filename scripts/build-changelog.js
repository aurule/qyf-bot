const fs = require("fs")
const path = require("path")

const changes = require("../changes");
const { version } = require("../package.json");

function buildSection(bucket) {
  return bucket.map(item => `* ${item}`).join("")
}

(async () => {
  const lines = [
    `# Changelog for qyf-bot v${version}`,
  ]

  if (changes.added.length) {
    lines.push("")
    lines.push("## Added")
    lines.push("")
    lines.push(buildSection(changes.added))
  }

  if (changes.changed.length) {
    lines.push("")
    lines.push("## Changed")
    lines.push("")
    lines.push(buildSection(changes.changed))
  }

  if (changes.removed.length) {
    lines.push("")
    lines.push("## Removed")
    lines.push("")
    lines.push(buildSection(changes.removed))
  }

  if (changes.fixed.length) {
    lines.push("")
    lines.push("## Fixed")
    lines.push("")
    lines.push(buildSection(changes.fixed))
  }

  lines.push("") // end with a newline

  fs.writeFileSync(
    path.join(__dirname, "../changelog", `${version}.md`),
    lines.join("\n")
  )

  changes.files.forEach((file) => {
    fs.rmSync(file)
  })
})()
