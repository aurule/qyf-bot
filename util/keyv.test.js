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

it("creates a keyv instance", () => {
  const { keyv } = require("./keyv")
  expect(keyv).toBeTruthy()
})
