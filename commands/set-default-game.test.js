"use strict";

const set_default_game_command = require("./set-default-game");
const { Guilds } = require("../models");
const { keyv } = require("../util/keyv.js");
const { transform } = require("../transformers/gameSelectTransformer");

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
  } catch (err) {
    console.log(err);
  }
});

afterEach(async () => {
  try {
    await guild.destroy();
  } catch (err) {
    console.log(err);
  }
});

describe('followup options', () => {
  describe('target channel', () => {
    it('is the current channel when no channel is passed', async () => {
      interaction.channel.id = 12345;
      interaction.command_options.channel = null;

      await set_default_game_command.execute(interaction);
      const stored_options = await keyv.get(interaction.id);

      expect(stored_options.target_channel.id).toBe(12345);
    });

    it('is the chosen channel when the channel option is present', async () => {
      interaction.channel.id = 12345;
      interaction.command_options.channel = { id: 67890 };

      await set_default_game_command.execute(interaction);
      const stored_options = await keyv.get(interaction.id);

      expect(stored_options.target_channel.id).toBe(67890);
    });
  })

  describe('scope text', () => {
    it('indicates the server when server wide flag is true', async () => {
      interaction.command_options.server = true;

      await set_default_game_command.execute(interaction);
      const stored_options = await keyv.get(interaction.id);

      expect(stored_options.scope_text).toBe("the server");
    })

    it('shows the chosen channel when server wide flag is false', async () => {
      interaction.channel.id = 12345;
      interaction.command_options.server = false;
      interaction.command_options.channel = { id: 67890 };

      await set_default_game_command.execute(interaction);
      const stored_options = await keyv.get(interaction.id);

      expect(stored_options.scope_text.id).toBe(67890);
    })

    it('shows the current channel when server wide flag is false and no channel was chosen', async () => {
      interaction.channel.id = 12345;
      interaction.command_options.server = false;

      await set_default_game_command.execute(interaction);
      const stored_options = await keyv.get(interaction.id);

      expect(stored_options.scope_text.id).toBe(12345);
    })
  })
})
