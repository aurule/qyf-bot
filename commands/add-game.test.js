const add_game_command = require("./add-game");
const { Guilds, Games } = require("../models");
const { UniqueConstraintError } = require("sequelize");

const { truncate } = require("../testing/truncate");

describe("execute", () => {
  let interaction = {};
  var guild;

  beforeAll(async () => {
    Object.assign(interaction, {
      options: {
        getString: (key) => "new game",
      },
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

  describe("without errors", () => {
    it("creates a new game", async () => {
      const spy = jest.spyOn(Games, "create");

      try {
        await add_game_command.execute(interaction);
      } catch (error) {
        console.log(error);
      }

      expect(spy).toHaveBeenCalledWith({
        name: "new game",
        guildId: guild.id,
      });
    });

    it("replies that the game was added", async () => {
      const spy = jest.spyOn(interaction, "reply");

      try {
        await add_game_command.execute(interaction);
      } catch (error) {
        console.log(error);
      }

      expect(spy).toHaveBeenCalledWith('Added game "new game"');
    });
  });

  describe("with a duplicate name", () => {
    it("replies that the game already exists", async () => {
      jest.spyOn(Games, "create").mockImplementation(async (args) => {
        throw new UniqueConstraintError();
      });
      const spy = jest.spyOn(interaction, "reply");

      try {
        await add_game_command.execute(interaction);
      } catch (error) {
        console.log(error);
      }

      expect(spy).toHaveBeenCalledWith('The game "new game" already exists!');
    });
  });

  describe("with an error", () => {
    it("replies with a boring message", async () => {
      jest.spyOn(Games, "create").mockImplementation(async (args) => {
        throw new Error();
      });
      const spy = jest.spyOn(interaction, "reply");

      try {
        await add_game_command.execute(interaction);
      } catch (error) {
        console.log(error);
      }

      expect(spy).toHaveBeenCalledWith("Something went wrong :-(");
    });
  });
});
