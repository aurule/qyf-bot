"use strict"

const { transform } = require("./command-choices-transformer")

it("creates an array of suitable objects", () => {
  const commands = [
    {
      name: "test 1",
      id: 1,
    },
    {
      name: "test 2",
      id: 2,
    },
  ]

  const data = transform(commands)

  expect(data).toEqual([
    {name: "test 1", value: "test 1"},
    {name: "test 2", value: "test 2"}
  ])
})

it("adds a menu suffix to menu commands", () => {
  const commands = [
    {
      name: "test 1",
      type: "menu",
    },
    {
      name: "test 2",
    }
  ]

  const data = transform(commands)

  expect(data).toEqual([
    {name: "test 1 ☰", value: "test 1"},
    {name: "test 2", value: "test 2"}
  ])
})
