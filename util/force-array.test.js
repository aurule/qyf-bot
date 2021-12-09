const { forceArray } = require("./force-array")

it("converts a single entity into an array containing that entity", () => {
  const result = forceArray(1)

  expect(result).toEqual([1])
})

it("passes through an array", () => {
  const result = forceArray([1])

  expect(result).toEqual([1])
})
