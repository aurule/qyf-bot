const { SlashCommandBuilder } = require("@discordjs/builders")

const { Guilds, Games, Quotes, Lines, DefaultGames } = require("../models")
const GameChoicesTransformer = require("../transformers/game-choices-transformer")

module.exports = {
  name: "list-quotes",
  data: (guild) =>
    new SlashCommandBuilder()
      .setName("list-quotes")
      .setDescription("Show the most recent quotes from the current game")
      .addUserOption((option) =>
        option.setName("speaker").setDescription("By a user")
      )
      .addStringOption((option) =>
        option.setName("alias").setDescription("By a name")
      )
      .addStringOption((option) =>
        option.setName("text").setDescription("Containing some text")
      )
      .addIntegerOption((option) =>
        option
          .setName("game")
          .setDescription("Game the quote is from. Defaults to channel's current game")
          .addChoices(GameChoicesTransformer.transform(guild.Games))
      )
      .addIntegerOption((option) =>
        option
          .setName("amount")
          .setDescription("Number of quotes to show (1-10)")
      ),
  async execute(interaction) {
    const speaker = interaction.options.getUser("speaker")
    const alias = interaction.options.getString("alias")
    const text = interaction.options.getString("text")
    const game_id = interaction.options.getInteger("game")
    const arg_amount = interaction.options.getInteger("amount")

    const amount = arg_amount ? arg_amount : 5

    const guild = await Guilds.findByInteraction(interaction, { include: Games })
    const game_ids = guild.Games.map(g => g.id)
    const quotes = await Quotes.findAll({where: {gameId: game_ids}})

    console.log(quotes)

    await interaction.reply(`Showing ${amount} quotes`)
  },
}
