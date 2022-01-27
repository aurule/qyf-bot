"use strict"

const PolicyChecker = require("./policy-checker")

const { Interaction } = require("../testing/interaction")

var interaction

describe("check", () => {
  beforeEach(() => {
    interaction = new Interaction()
  })

  it("allows when policies are empty", async () => {
    const policyResult = await PolicyChecker.check([], interaction)

    expect(policyResult.allowed).toBeTruthy()
  })

  it("allows when policies are undefined", async () => {
    const policyResult = await PolicyChecker.check(undefined, interaction)

    expect(policyResult.allowed).toBeTruthy()
  })

  it("allows with one policy that allows", async () => {
    const policy = {
      allow: async () => true,
    }

    const policyResult = await PolicyChecker.check(policy, interaction)

    expect(policyResult.allowed).toBeTruthy()
  })

  it("allows when all policies allow", async () => {
    const policy1 = {
      allow: async () => true,
    }
    const policy2 = {
      allow: async () => true,
    }

    const policyResult = await PolicyChecker.check(
      [policy1, policy2],
      interaction
    )

    expect(policyResult.allowed).toBeTruthy()
  })

  it("denies when one policy fails", async () => {
    const policy1 = {
      allow: async () => true,
    }
    const policy2 = {
      allow: async () => false,
      errorMessage: "nope",
    }

    const policyResult = await PolicyChecker.check(
      [policy1, policy2],
      interaction
    )

    expect(policyResult.allowed).toBeFalsy()
  })

  it("includes error messages of all failed policies", async () => {
    const policy1 = {
      allow: async () => true,
      errorMessage: "wrong",
    }
    const policy2 = {
      allow: async () => false,
      errorMessage: "nope",
    }
    const policy3 = {
      allow: async () => false,
      errorMessage: "bad",
    }

    const policyResult = await PolicyChecker.check(
      [policy1, policy2, policy3],
      interaction
    )

    expect(policyResult.errorMessages).toContain("nope")
    expect(policyResult.errorMessages).toContain("bad")
    expect(policyResult.errorMessages).not.toContain("wrong")
  })
})

describe("PolicyResult", () => {
  it("ingests bare string message", () => {
    const result = new PolicyChecker.PolicyResult(true, "message")

    expect(result.errorMessages).toEqual(["message"])
  })

  it("accepts an array of messages", () => {
    const result = new PolicyChecker.PolicyResult(true, ["m1", "m2"])

    expect(result.errorMessages).toEqual(["m1", "m2"])
  })
})
