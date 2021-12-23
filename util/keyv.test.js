var old_env

beforeAll(() => {
  old_env = process.env
})

beforeEach(() => {
  jest.resetModules()
  process.env = { ...old_env }
})

afterAll(() => {
  process.env = old_env
})

it("creates the correct keyv instances", () => {
  const { followup_store, cache } = require("./keyv")
  expect(followup_store).toBeTruthy()
  expect(cache).toBeTruthy()
})
