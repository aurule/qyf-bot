"use strict"

const fs = require("fs")
const path = require("path")

const { noTests, noDotFiles } = require("../util/filters.js")

const basename = path.basename(__filename)
const buckets = {
  added: [],
  changed: [],
  removed: [],
  fixed: [],
  files: [],
}

fs.readdirSync(__dirname)
  .filter(noTests)
  .filter(noDotFiles)
  .filter((file) => {
    return (
      file !== basename
    )
  })
  .forEach((file) => {
    const bucket_name = path.extname(file).substring(1)
    const file_path = path.join(__dirname, file)
    const contents = fs.readFileSync(file_path, 'utf-8')
    buckets[bucket_name].push(contents.trim())
    buckets.files.push(file_path)
  })

module.exports = buckets
