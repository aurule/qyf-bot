"use strict"

const { simpleflake } = require("simpleflakes")
const { Permissions } = require('discord.js');

class Interaction {
  constructor(snowflake) {
    this.id = simpleflake()
    this.command_options = {}
    this.options = {
      getString: (key) => this.command_options[key].toString(),
      getBoolean: (key) => !!this.command_options[key],
      getChannel: (key) => this.command_options[key],
      getInteger: (key) => this.command_options[key],
      getUser: (key) => this.command_options[key],
    }
    this.guildId = snowflake,
    this.guild = {
      id: snowflake,
      members: [],
      channels: {
        fetch: (key) => {
          id: key
        },
      },
    }
    this.guild.members.fetch = (user) => user
    this.channel = {
      id: simpleflake(),
      isThread: () => false,
      guildId: snowflake,
      parentId: simpleflake(),
      messages: {},
    }
    this.message = {}
    this.user = {
      id: simpleflake(),
      username: "Test User",
      permissions: new Permissions(Permissions.FLAGS.DEFAULTS),
    }
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
