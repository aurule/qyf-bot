"use strict";

const set_default_game_command = require("./set-default-game");
const { Guilds, Games, DefaultGames } = require("../models");
const { keyv } = require("../util/keyv.js");
const GameSelectTransformer = require("../transformers/gameSelectTransformer");

const { Interaction } = require("../testing/interaction");
const { simpleflake } = require("simpleflakes");

var guild;
var interaction;

beforeEach(async () => {
  try {
    guild = await Guilds.create({
      name: "Test Guild",
      snowflake: simpleflake(),
    });
    interaction = new Interaction(guild.snowflake);
    interaction.channel.id = simpleflake();
    interaction.channel.guild = {id: guild.snowflake};
    interaction.channel.name = 'test channel';
  } catch (err) {
    console.log(err);
  }
});

afterEach(async () => {
  try {
    await Games.destroy({where: {guildId: guild.id}})
    await guild.destroy();
  } catch (err) {
    console.log(err);
  }
});

describe("followupOptions", () => {
  describe('when server wide flag is true', () => {
    beforeEach(() => {
      interaction.command_options.server = true;
    })

    it("sets scope text to the server", async () => {
      await set_default_game_command.execute(interaction);
      const stored_options = await keyv.get(interaction.id);

      expect(stored_options.scope_text).toBe("the server");
    })

    it("sets the target type to guild", async () => {
      await set_default_game_command.execute(interaction);
      const stored_options = await keyv.get(interaction.id);

      expect(stored_options.target_type).toBe(DefaultGames.TYPE_GUILD);
    })

    it("stores the server snowflake", async () => {
      await set_default_game_command.execute(interaction);
      const stored_options = await keyv.get(interaction.id);

      expect(stored_options.target_snowflake).toEqual(guild.snowflake.toString());
    })
  })

  describe("when server wide flag is false", () => {
    it("sets scope text to chosen channel reference", async () => {
      await set_default_game_command.execute(interaction);
      const stored_options = await keyv.get(interaction.id);

      expect(stored_options.scope_text).toEqual(interaction.channel.name);
    })

    it("sets the target type to channel", async () => {
      await set_default_game_command.execute(interaction);
      const stored_options = await keyv.get(interaction.id);

      expect(stored_options.target_type).toBe(DefaultGames.TYPE_CHANNEL);
    })

    it("stores the channel snowflake", async () => {
      await set_default_game_command.execute(interaction);
      const stored_options = await keyv.get(interaction.id);

      expect(stored_options.target_snowflake).toEqual(interaction.channel.id.toString());
    })
  })
});

describe("reply", () => {
  it('includes an action row', async () => {
    const reply = await set_default_game_command.execute(interaction);

    expect(reply.components).not.toBeFalsy()
  })

  it("shows a select for the guild's games", async () => {
    const game = await Games.create({
      name: 'test game',
      guildId: guild.id
    })
    const transformSpy = jest.spyOn(GameSelectTransformer, 'transform');

    const reply = await set_default_game_command.execute(interaction)
    const selectOptions = reply.components[0].components[0].options;

    expect(selectOptions[0].label).toEqual(game.name);
  });
});
