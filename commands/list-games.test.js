const list_games_command = require("./list-games");
const { Guilds, Games, DefaultGames } = require("../models");
const { MessageMentions: { CHANNELS_PATTERN } } = require('discord.js');

const { Interaction } = require("../testing/interaction");
const { simpleflake } = require("simpleflakes");

var interaction;
var guild;

beforeEach(async () => {
  try {
    guild = await Guilds.create({
      name: "Test Guild",
      snowflake: simpleflake(),
    });
    interaction = new Interaction(guild.snowflake);
  } catch (err) {
    console.log(err);
  }
});

afterEach(async () => {
  try {
    await Games.destroy({ where: { guildId: guild.id } });
    await guild.destroy();
  } catch (err) {
    console.log(err);
  }
});

describe("execute", () => {
  var buildGamesListSpy;

  beforeEach(() => {
    buildGamesListSpy = jest
      .spyOn(list_games_command, "buildGamesList")
      .mockImplementation((games) => games);
  });

  it("includes all games for the current guild", async () => {
    const game1 = await Games.create({
      name: "test game 1",
      guildId: guild.id,
    });
    const game2 = await Games.create({
      name: "test game 2",
      guildId: guild.id,
    });

    await list_games_command.execute(interaction);
    const result_names = buildGamesListSpy.mock.results[0].value.map(
      (g) => g.name
    );//

    expect(result_names).toEqual([game1.name, game2.name]);
  });

  it("excludes games from other guilds", async () => {
    const wrong_guild = await Guilds.create({
      name: "wrong guild",
      snowflake: simpleflake(),
    });
    const wrong_game = await Games.create({
      name: "wrong game",
      guildId: wrong_guild.id,
    });
    const right_game = await Games.create({
      name: "right game",
      guildId: guild.id,
    });

    await list_games_command.execute(interaction);
    const result_names = buildGamesListSpy.mock.results[0].value.map(
      (g) => g.name
    );

    expect(result_names).toEqual([right_game.name]);

    // special teardown required
    await wrong_game.destroy();
    await wrong_guild.destroy();
  });
});

describe("buildGamesList", () => {

  it("shows the name of each game", async () => {
    const game1 = await Games.create({
      name: "test game 1",
      guildId: guild.id,
    });
    const game2 = await Games.create({
      name: "test game 2",
      guildId: guild.id,
    });

    const gamesList = await Games.findAll({
      where: { guildId: guild.id },
      include: DefaultGames,
    });
    const result = list_games_command.buildGamesList(gamesList);

    expect(result).toMatch(game1.name);
    expect(result).toMatch(game2.name);
  });

  it("shows the server name when game is server default", async () => {
    const game = await Games.create({
      name: 'test game',
      guildId: guild.id
    })
    const defaultGame = await DefaultGames.create({
      name: guild.name,
      type: DefaultGames.TYPE_GUILD,
      gameId: game.id,
      snowflake: guild.snowflake
    })

    const gamesList = await Games.findAll({
      where: { guildId: guild.id },
      include: DefaultGames,
    });
    const result = list_games_command.buildGamesList(gamesList);

    expect(result).toMatch(guild.name);

    await defaultGame.destroy();
  });

  it("shows a channel reference when game is channel default", async () => {
    const game = await Games.create({
      name: 'test game',
      guildId: guild.id
    })
    const defaultGame = await DefaultGames.create({
      name: 'Some Channel',
      type: DefaultGames.TYPE_CHANNEL,
      gameId: game.id,
      snowflake: simpleflake()
    })

    const gamesList = await Games.findAll({
      where: { guildId: guild.id },
      include: DefaultGames,
    });
    const result = list_games_command.buildGamesList(gamesList);

    expect(result).toMatch(CHANNELS_PATTERN);

    await defaultGame.destroy();
  });
});
