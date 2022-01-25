"use strict"

const { channelMention } = require("@discordjs/builders")

const { DefaultGames, Games } = require("../models")

class DefaultGameScope {
  constructor({name, scope_text, target_type, target_snowflake}) {
    /**
     * Name of the target. Usually the guild or channel name
     * @type {string}
     */
    this.name = name

    /**
     * Presentable text for the scope. Usually the channel name or "the server".
     * @type {string}
     */
    this.scope_text = scope_text

    /**
     * Type of the target scope.
     * One of [DefaultGames.TYPE_CHANNEL, DefaultGames.TYPE_GUILD].
     * @type {string}
     */
    this.target_type = target_type

    /**
     * Discord snowflake for the target
     * @type {string}
     */
    this.target_snowflake = target_snowflake
  }

  /**
   * Get a reference for this scope's target
   *
   * When the scope is for a server, returns a simple string. For a channel or
   * topic, it returns a discord channel mention string.
   *
   * @return {string} String description or mention of the scope's target
   */
  scopeMention() {
    switch (this.target_type) {
      case DefaultGames.TYPE_GUILD:
        return "the server"
      case DefaultGames.TYPE_CHANNEL:
        return channelMention(this.target_snowflake)
    }
  }
}

module.exports = {
  DefaultGameScope,

  /**
   * Get the default game scope information based on an explicit channel obj
   * and server flag
   *
   * @param  {Channel}  target_channel  Discord channel object
   * @param  {bool}     server_wide     Whether to return the server scope for
   *                                    the channel
   * @return {DefaultGameScope}         Object containing the info of the chosen
   *                                    scope
   */
  explicitScope: (target_channel, server_wide) => {
    if (server_wide) {
      return new DefaultGameScope({
        name: target_channel.guild.name,
        scope_text: "the server",
        target_type: DefaultGames.TYPE_GUILD,
        target_snowflake: target_channel.guild.id.toString(),
      })
    }
    return new DefaultGameScope({
      name: target_channel.name,
      scope_text: target_channel.name,
      target_type: DefaultGames.TYPE_CHANNEL,
      target_snowflake: target_channel.id.toString(),
    })
  },

  /**
   * Gets the default game for a channel based on its parents:
   *
   * Searches by channel's snowflake, then parent's snowflake, then server.
   *
   * @param  {Channel} current_channel The discord channel to find a game for
   * @return {Game|null}               The default game for the channel, or null if none can be found.
   */
  gameForChannel: async (current_channel) => {
    if (!current_channel) return null

    const search_ids = []
    var target_channel

    if(current_channel.isThread()) {
      search_ids.push(current_channel.id.toString())
      target_channel = await current_channel.guild.channels.fetch(current_channel.parentId)
    } else {
      target_channel = current_channel
    }

    search_ids.push(current_channel.id.toString())
    if (current_channel.parentId) search_ids.push(current_channel.parentId.toString())
    search_ids.push(current_channel.guildId.toString())

    const default_game = await DefaultGames.findOne({where: {snowflake: search_ids}, include: Games})
    if(!default_game) return null
    return default_game.Game
  }
}
