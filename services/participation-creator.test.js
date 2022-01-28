const ParticipationCreator = require("./participation-creator")
const { Guilds, Users, Participations } = require("../models")

const { Interaction } = require("../testing/interaction")
const { simpleflake } = require("simpleflakes")

async function destroyParticipation(participation) {
  const guild = await participation.getGuild()
  const user = await participation.getUser()

  await participation.destroy()

  await guild.destroy()
  await user.destroy()
}

describe("findOrCreateByInteraction", () => {
  it("returns null when there is no guildId", async () => {
    const interaction = {}

    const result = await ParticipationCreator.findOrCreateByInteraction(interaction)

    expect(result).toBeNull()
  })

  it("creates a guild when it does not exist", async () => {
    const newGuildId = simpleflake()
    const interaction = new Interaction(newGuildId)

    const [participation, _isNewPart] = await ParticipationCreator.findOrCreateByInteraction(interaction)
    const guild = await participation.getGuild()

    expect(guild.snowflake).toEqual(newGuildId.toString())

    await destroyParticipation(participation)
  })

  it("uses an existing guild", async () => {
    const guild = await Guilds.create({
      snowflake: simpleflake().toString(),
      name: "test guild",
    })
    const interaction = new Interaction(guild.snowflake)

    const [participation, _isNewPart] = await ParticipationCreator.findOrCreateByInteraction(interaction)
    const partGuild = await participation.getGuild()

    expect(partGuild.id).toEqual(guild.id)

    await destroyParticipation(participation)
  })

  it("creates a user when it does not exist", async () => {
    const interaction = new Interaction(simpleflake())

    const [participation, _isNewPart] = await ParticipationCreator.findOrCreateByInteraction(interaction)
    const partUser = await participation.getUser()

    expect(partUser.snowflake).toEqual(interaction.user.id.toString())

    await destroyParticipation(participation)
  })

  it("uses an existing user", async () => {
    const interaction = new Interaction(simpleflake())
    const user = await Users.create({
      snowflake: interaction.user.id.toString(),
      name: "test user",
    })

    const [participation, _isNewPart] = await ParticipationCreator.findOrCreateByInteraction(interaction)
    const partUser = await participation.getUser()

    expect(partUser.id).toEqual(user.id)

    await destroyParticipation(participation)
  })
})
