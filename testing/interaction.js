"use strict"

const { simpleflake } = require("simpleflakes")

class Interaction {
  constructor(snowflake) {
    this.id = simpleflake()
    this.command_options = {}
    this.options = {
      getString: (key) => this.command_options[key].toString(),
      getBoolean: (key) => !!this.command_options[key],
      getChannel: (key) => this.command_options[key],
    }
    this.guild = {
      id: snowflake,
    }
    this.channel = {}
    this.message = {}
  }

  async reply(msg) {
    return msg
  }

  async update(msg) {
    return msg
  }

  async followUp(msg) {
    return msg
  }
}

module.exports = {
  Interaction: Interaction,
}
