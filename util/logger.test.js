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

it("creates a pino instance", () => {
  const { logger } = require("./logger")
  expect(logger).toBeTruthy()
})
