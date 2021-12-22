# Command Implementation Guide

This is a bare-bones guide to the elements of a qyf-bot command.

The command object looks like this:

```ts
{
    name: string,                       // "command-name"
    type?: string,                      // "slash"
    data(options?): Builder,            // SlashCommandBuilder
    async execute(interaction): Promise,
    help(options): string               // "my very long help text"
}
```

(format is written in typescript, even though qyf-bot uses javascript)

Requirements:

* The `name` *must* be the same as used in the builder.setName() call within `data`
* `type` is optional and describes the type of command: "menu" or "slash". Defaults to "slash".
* `data` must return an instance of a discordjs command builder
* `data` receives a `guild` argument for guild commands. This can be discarded if the command arguments don't need it. It does not receive arguments for global commands.
* `execute` should return `interaction.reply()` or similar
* `help` receives an options object with the following attributes
* `help` must return a string

Help options object:

```ts
{
    command_name: string, // "/formatted-command-name"
}
```

The command_name attribute is populated by `CommandHelpPresenter.present()`.

## File Locations

Guild commands live in the `/commands` directory. Global commands live in `/commands/global`.