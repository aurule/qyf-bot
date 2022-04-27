"use strict"

const { userMention } = require("@discordjs/builders")

module.exports = {
  /**
   * Construct reply text for a quote action
   *
   * The reply takes the form of "@reporter quoted @speaker as alias: text"
   *
   * @param  {Discord user} options.reporter Discord user object for the line reporter
   * @param  {Discord user} options.speaker  Discord user object for the line reporter
   * @param  {string}       options.text     Text of the line
   * @param  {string|null}  options.alias    Alias of the speaker. Optional.
   * @param  {String}       options.action   Action the reporter took. Defaults to "quoted".
   *
   * @return {string}       The complete reply string
   */
  quoteReply: ({reporter, speaker, text, alias = null, action = "quoted"}) => {
    const lines = []

    lines.push(userMention(reporter.id))
    lines.push(` ${action} `)
    if (speaker.anonymous) {
      alias ? lines.push(alias) : lines.push(speaker.username)
    } else {
      if (speaker.id === reporter.id) {
        lines.push("themself")
      } else {
        lines.push(userMention(speaker.id))
      }
      if (alias) {
        lines.push(" as ")
        lines.push(alias)
      }
    }
    lines.push(": ")
    lines.push(text)

    return lines.join("")
  }
}
