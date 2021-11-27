const list_games_command = require('./list-games');
const { channelMention } = require("@discordjs/builders");
const { Guilds, Games, DefaultGames } = require("../models");

describe('execute', () => {
  let interaction = {}
  var guild;

  beforeAll(async () => {
    Object.assign(interaction, {
      guild: {
        id: 12345,
      },
      reply: async (msg) => msg,
    });
  });

  beforeEach(async () => {
    try {
      await truncate();
      guild = await Guilds.create({ name: "Test Guild", snowflake: 12345 });
    } catch (err) {
      console.log(err);
    }
  });

  it.todo('includes all games for the current guild')
  it.todo('excludes games from other guilds')
  it.todo('shows the default status for each game')
})
