"use strict"

module.exports = {
  /**
   * Determine which name to use for a speaker
   *
   * If present, the alias is always returned.
   * If there is no alias, then the nickname is returned instead.
   * If there is no alias or nickname, the username is returned.
   *
   * @param  {[type]} username [description]
   * @param  {[type]} nickname [description]
   * @param  {[type]} alias    [description]
   * @return {[type]}          [description]
   */
  determineName: ({ username, nickname, alias } = {}) => {
    if (alias) return alias
    if (nickname) return nickname
    return username
  },
}
