const ready = require("./ready");

const { logger } = require("../util/logger");
const { Client } = require("discord.js");
jest.mock("discord.js");

describe("properties", () => {
  it("attaches to the event name 'ready'", () => {
    expect(ready.name).toBe("ready");
  });

  it("runs once", () => {
    expect(ready.once).toBe(true);
  });
});

describe("execute", () => {
  beforeAll(() => {
    Client.mockImplementation(() => {
      return {
        user: {
          tag: "qyf-bot",
        },
      };
    });
  });

  it("logs a ready notice", () => {
    const spy = jest.spyOn(logger, "info");

    ready.execute(new Client());

    expect(spy).toHaveBeenCalled();
  });
});
