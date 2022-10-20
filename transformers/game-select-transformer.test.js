"use strict"

const { transform } = require("./game-select-transformer")

it("creates an array of suitable objects", () => {
  const games = [
    {
      name: "test 1",
      description: "test game 1",
      id: 1,
    },
    {
      name: "test 2",
      description: "test game 2",
      id: 2,
    },
  ]

  const data = transform(games)

  expect(data).toEqual([
    {
      label: "test 1",
      description: "test game 1",
      value: "1",
    },
    {
      label: "test 2",
      description: "test game 2",
      value: "2",
    },
  ])
})

it("omits the description member when null", () => {
  const games = [
    {
      name: "test 1",
      description: null,
      id: 1,
    },
  ]

  const data = transform(games)

  expect(data).toEqual([
    {
      label: "test 1",
      value: "1",
    },
  ])
})

it("omits the description member when blank", () => {
  const games = [
    {
      name: "test 1",
      description: '',
      id: 1,
    },
  ]

  const data = transform(games)

  expect(data).toEqual([
    {
      label: "test 1",
      value: "1",
    },
  ])
})

it("omits the description member when undefined", () => {
  const games = [
    {
      name: "test 1",
      id: 1,
    },
  ]

  const data = transform(games)

  expect(data).toEqual([
    {
      label: "test 1",
      value: "1",
    },
  ])
})
