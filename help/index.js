"use strict"

const fs = require("fs")
const path = require("path")
const { Collection } = require("discord.js")

const { jsNoTests, noDotFiles } = require("../util/filters.js")

const basename = path.basename(__filename)
const topics = new Collection()

fs.readdirSync(__dirname)
  .filter(jsNoTests)
  .filter(noDotFiles)
  .filter((file) => {
    return (
      file !== basename
    )
  })
  .forEach((file) => {
    const topic = require(path.join(__dirname, file))
    topics.set(topic.name, topic)
  })

module.exports = topics
