"use strict"

/**
 * Get the correct response function to use for messages based on the interaction's reply state
 *
 * Replied: followUp
 * Deferred and not replied: editReply
 * neither: reply
 *
 * @param  {Interaction} interaction Discord interaction object
 * @return {string}                  Name of the response method to use
 */
exports.getReplyFn = (interaction) => {
  if (interaction.replied) return "followUp"
  if (interaction.deferred) return "editReply"
  return "reply"
}
