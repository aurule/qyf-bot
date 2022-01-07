"use strict"

const { memberNicknameMention } = require("@discordjs/builders")

module.exports = {

  quoteReply: ({reporter, speaker, text, alias = null, action = "quoted"}) => {
    const lines = []

    lines.push(memberNicknameMention(reporter.id))
    lines.push(` ${action} `)
    lines.push(memberNicknameMention(speaker.id))
    if (alias) {
      lines.push(" as ")
      lines.push(alias)
    }
    lines.push(": ")
    lines.push(text)

    return lines.join("")
  }
}
