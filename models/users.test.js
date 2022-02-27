const UsersModel = require("./users")
const { Users } = require("./")

describe("findBySnowflake", () => {
  var findSpy

  beforeEach(() => {
    findSpy = jest.spyOn(Users, "findOne")
  })

  it("searches for the snowflake", async () => {
    await Users.findBySnowflake("12345")

    expect(findSpy).toHaveBeenCalledWith({ where: { snowflake: "12345" } })
  })

  it("passes options through", async () => {
    await Users.findBySnowflake("12345", {test: "yes"})

    expect(findSpy).toHaveBeenCalledWith({ where: { snowflake: "12345" }, test: "yes" })
  })

  it("returns null with a missing snowflake", async () => {
    const result = await Users.findBySnowflake()

    expect(result).toBeNull()
  })
})
