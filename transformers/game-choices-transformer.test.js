"use strict"

const { transform } = require("./game-choices-transformer")

it("creates an array of suitable objects", () => {
  const games = [
    {
      name: "test 1",
      id: 1,
    },
    {
      name: "test 2",
      id: 2,
    },
  ]

  const data = transform(games)

  expect(data).toEqual([
    ["test 1", 1],
    ["test 2", 2]
  ])
})
