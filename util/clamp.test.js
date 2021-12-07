"use strict"

const { clamp } = require("./clamp")

it("returns num if it's in range", () => {
  const result = clamp(5, 1, 10)

  expect(result).toEqual(5)
})

it("returns min if num is too low", () => {
  const result = clamp(2, 10, 20)

  expect(result).toEqual(10)
})

it("returns max if num is too high", () => {
  const result = clamp(50, 1, 10)

  expect(result).toEqual(10)
})
