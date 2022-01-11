const feedback_command = require("./qyf-feedback")
const { Feedback, Users, Guilds } = require("../models")

const { Interaction } = require("../testing/interaction")
const { simpleflake } = require("simpleflakes")

var user
var interaction

describe("execute", () => {
  describe("with an existing user", () => {
    beforeEach(async () => {
      interaction = new Interaction()
      user = await Users.create({
        name: "Test User",
        snowflake: interaction.user.id.toString(),
      })
      interaction.command_options.type = Feedback.TYPE_COMMENT
      interaction.command_options.content = "test comment"
    })

    afterEach(async () => {
      await Feedback.destroy({ where: { reporterId: user.id } })
      await user.destroy()
    })

    it("creates a new feedback record", async () => {
      await feedback_command.execute(interaction)

      const new_feedback = await Feedback.findOne({where: {reporterId: user.id}})

      expect(new_feedback).toBeTruthy()
    })

    it("replies with some text", async () => {
      const reply = await feedback_command.execute(interaction)

      expect(reply).toBeTruthy()
    })
  })

  describe("with no existing user", () => {
    beforeEach(() => {
      interaction = new Interaction()
      interaction.command_options.type = Feedback.TYPE_COMMENT
      interaction.command_options.content = "test comment"
    })

    afterEach(async () => {
      user = await Users.findOne({
        where: { snowflake: interaction.user.id.toString() },
      })
      await Feedback.destroy({ where: { reporterId: user.id } })
      await user.destroy()
    })

    it("creates a new user record", async () => {
      await feedback_command.execute(interaction)

      const new_user = await Users.findOne({
        where: { snowflake: interaction.user.id.toString() },
      })

      expect(new_user).toBeTruthy()
    })

    it("creates a feedback record", async () => {
      await feedback_command.execute(interaction)

      const new_user = await Users.findOne({
        where: { snowflake: interaction.user.id.toString() },
      })
      const new_feedback = await Feedback.findOne({where: {reporterId: new_user.id}})

      expect(new_feedback).toBeTruthy()
    })

    it("replies with some text", async () => {
      const reply = await feedback_command.execute(interaction)

      expect(reply).toBeTruthy()
    })
  })
})

beforeEach(async () => {
  try {
    user = await Users.create({
      name: "Test User",
      snowflake: simpleflake().toString(),
    })
    interaction = new Interaction()
    interaction.member_snowflake = user.snowflake
  } catch (err) {
    console.log(err)
  }

  interaction.command_options.type = Feedback.TYPE_COMMENT
  interaction.command_options.content = "test comment"
})

afterEach(async () => {
  try {
    await Feedback.destroy({ where: { reporterId: user.id } })
    await user.destroy()
  } catch (err) {
    console.log(err)
  }
})

describe("data", () => {
  // This test is very bare-bones because we're really just
  // testing that the various calls to discord.js functions
  // were executed properly.
  it("returns something", () => {
    const command_data = feedback_command.data({})

    expect(command_data).toBeTruthy()
  })

  it("uses the command's name", () => {
    const command_data = feedback_command.data()

    expect(command_data.name).toEqual(feedback_command.name)
  })
})

describe("help", () => {
  it("includes the command name in the output", () => {
    const help_text = feedback_command.help({ command_name: "sillyness" })

    expect(help_text).toMatch("sillyness")
  })
})
