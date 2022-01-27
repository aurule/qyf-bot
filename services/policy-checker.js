"use strict"

const { forceArray } = require("../util/force-array")

class PolicyResult {
  constructor(allowed = true, errorMessages = []) {
    this.allowed = allowed
    this.errorMessages = forceArray(errorMessages)
  }
}

module.exports = {
  /**
   * Applies one or more policies to the passed interaction
   *
   * @param  {Object|Array<Object>} policies    Policy object(s) with an async allow() method
   * @param  {Interaction}          interaction Discord interaction object
   * @return {PolicyResult}                     True if all policies allow the interaction, false otherwise.
   *                                            Second member holds all failed policy error messages.
   */
  async check(policies, interaction) {
    if (!policies) return new PolicyResult()

    return Promise.all(
      forceArray(policies).map((policy) =>
        policy.allow(interaction).then((allowed) => {
          return { result: allowed, errorMessage: policy.errorMessage }
        })
      )
    ).then((allResults) => {
      const errorLines = []
      const allowed = allResults.reduce(
        (accumulator, curr) => {
          if (!curr.result) errorLines.push(curr.errorMessage)
          return accumulator && curr.result
        },
        { result: true }
      )

      return new PolicyResult(allowed, errorLines)
    })
  },
  PolicyResult,
}
