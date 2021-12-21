"use strict"

const { simpleflake } = require("simpleflakes")
const { Permissions, Collection } = require('discord.js');

class Interaction {
  constructor(snowflake = null) {
    const member_snowflake = simpleflake()

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
    this.member = {
      id: member_snowflake,
      permissions: new Permissions(Permissions.FLAGS.DEFAULTS),
      user: {
        id: member_snowflake,
        username: "Test User"
      }
    }
    this.user = {
      id: member_snowflake,
      username: "Test User",
    }
    this.client = {
      commands: new Collection()
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
