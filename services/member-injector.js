"use strict"

module.exports = {
  /**
   * Anonymous Discord guild member null object
   *
   * This is a static stand-in that allows the qyf-bot guild member to act as an "anonymous" quote speaker
   *
   * @type {Object}
   * @attribute user      {Object}  Limited Discord user object with an id and username
   * @attribute anonymous {boolean} Special attr that only exists on this null object, not on normal member objects.
   */
  anonymousMember: {
    user: {
      id: process.env.CLIENT_ID,
      username: "Anonymous",
      anonymous: true,
    },
    nickname: "Anonymous",
    anonymous: true,
  },
  /**
   * Get a guild member or anonymousMember null object
   *
   * Fetches the guild member under most circumstances.
   *
   * @param  {Discord guild}  guild Guild object the user is a part of
   * @param  {Discord user}   user  User object to look up
   * @return {Promise<User>}        Promise resolving to a Discord user object, or anonymousMember lookalike
   */
  async memberOrAnonymous(guild, user) {
    if (user.id === process.env.CLIENT_ID) {
      return module.exports.anonymousMember
    }
    return guild.members.fetch(user)
  }
}
