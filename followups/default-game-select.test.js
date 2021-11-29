const default_game_select_followup = require("./default-game-select");
const { keyv } = require("../util/keyv.js");
const { Guilds, Games, DefaultGames } = require("../models");

const { Interaction } = require("../testing/interaction");
const { simpleflake } = require("simpleflakes");

var guild;
var interaction;
var old_interaction_id;
var game;

beforeEach(async () => {
  try {
    guild = await Guilds.create({
      name: "Test Guild",
      snowflake: simpleflake().toString(),
    });

    game = await Games.create({
      name: "test game",
      guildId: guild.id,
    });

    old_interaction_id = simpleflake().toString();
    interaction = new Interaction(guild.snowflake);
    interaction.message = {
      interaction: {
        id: old_interaction_id,
      },
    };
    interaction.values = [game.id];
  } catch (err) {
    console.log(err);
  }
});

afterEach(async () => {
  try {
    const games = await Games.findAll({ where: { guildId: guild.id } });
    await DefaultGames.destroy({ where: { gameId: games.map((g) => g.id) } });
    await Games.destroy({ where: { guildId: guild.id } });
    await guild.destroy();
  } catch (err) {
    console.log(err);
  }
});

it("updates an existing default game record if one exists", async () => {
  const channel_snowflake = simpleflake().toString();
  const record = await DefaultGames.create({
    name: "test channel",
    gameId: game.id,
    type: DefaultGames.TYPE_CHANNEL,
    snowflake: channel_snowflake,
  });

  const game2 = await Games.create({
    name: 'second game',
    guildId: guild.id,
  })
  interaction.values[0] = game2.id;
  const options = {
    name: 'another test channel',
    scope_text: "another test channel",
    target_type: DefaultGames.TYPE_CHANNEL,
    target_snowflake: channel_snowflake,
  };
  await keyv.set(old_interaction_id, options);

  await default_game_select_followup.execute(interaction);

  await record.reload();
  expect(record.gameId).toEqual(game2.id);
});

it("creates a new default game record if none exists", async () => {
  const channel_snowflake = simpleflake().toString();
  const options = {
    name: "test channel",
    scope_text: "test channel",
    target_type: DefaultGames.TYPE_CHANNEL,
    target_snowflake: channel_snowflake,
  };
  await keyv.set(old_interaction_id, options);

  await default_game_select_followup.execute(interaction);

  const record = await DefaultGames.findOne({
    where: { snowflake: channel_snowflake },
  });

  expect(record).toBeTruthy();
});

it("updates with the chosen game", async() => {
  const channel_snowflake = simpleflake().toString();
  const options = {
    name: "test channel",
    scope_text: "test channel",
    target_type: DefaultGames.TYPE_CHANNEL,
    target_snowflake: channel_snowflake,
  };
  await keyv.set(old_interaction_id, options);
  const updateSpy = await jest.spyOn(interaction, 'update')

  await default_game_select_followup.execute(interaction);

  expect(updateSpy).toHaveBeenCalled()
});

it("replies that the game was set as default", async() => {
  const channel_snowflake = simpleflake().toString();
  const options = {
    name: "test channel",
    scope_text: "test channel",
    target_type: DefaultGames.TYPE_CHANNEL,
    target_snowflake: channel_snowflake,
  };
  await keyv.set(old_interaction_id, options);

  const reply = await default_game_select_followup.execute(interaction);

  expect(reply).toMatch("test game is now the default for test channel.");
});

it("replies that there was an error when there was an error", async () => {
  jest.spyOn(DefaultGames, 'upsert').mockImplementation(() => {throw new Error();});

  const channel_snowflake = simpleflake().toString();
  const options = {
    name: "test channel",
    scope_text: "test channel",
    target_type: DefaultGames.TYPE_CHANNEL,
    target_snowflake: channel_snowflake,
  };
  await keyv.set(old_interaction_id, options);

  const reply = await default_game_select_followup.execute(interaction);

  expect(reply.content).toMatch("Something went wrong")
})
